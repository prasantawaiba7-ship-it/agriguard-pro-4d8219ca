import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CropInfo {
  id: number;
  name_ne: string;
  name_en: string;
  category: string | null;
  image_url: string | null;
}

interface GuideSection {
  id: string;
  section: string;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
  step_number: number;
  media_url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      crop_id, 
      crop_name, 
      stage, 
      problem_type, 
      severity,
      question, 
      language = 'ne' 
    } = await req.json();

    if (!crop_id && !crop_name) {
      return new Response(
        JSON.stringify({ error: "crop_id or crop_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get crop info
    let cropInfo: CropInfo | null = null;
    let resolvedCropId = crop_id;

    if (crop_id) {
      const { data: cropData } = await supabase
        .from("crops")
        .select("id, name_ne, name_en, category, image_url")
        .eq("id", crop_id)
        .single();
      cropInfo = cropData;
    } else if (crop_name) {
      // Find crop by name (Nepali or English)
      const { data: cropData } = await supabase
        .from("crops")
        .select("id, name_ne, name_en, category, image_url")
        .or(`name_ne.eq.${crop_name},name_en.ilike.${crop_name}`)
        .limit(1)
        .maybeSingle();
      
      if (cropData) {
        cropInfo = cropData;
        resolvedCropId = cropData.id;
      }
    }

    // Check for matching guide rule (if crop has rules)
    let matchedRule = null;
    if (resolvedCropId) {
      let ruleQuery = supabase
        .from("guide_rules")
        .select("*")
        .eq("crop_id", resolvedCropId)
        .eq("is_active", true)
        .order("priority", { ascending: false });

      // Add optional filters
      if (stage) ruleQuery = ruleQuery.eq("stage", stage);
      if (problem_type) ruleQuery = ruleQuery.eq("problem_type", problem_type);
      if (severity) ruleQuery = ruleQuery.eq("severity", severity);

      const { data: rules } = await ruleQuery.limit(1);
      matchedRule = rules?.[0] || null;
    }

    // Fetch guide sections
    // Prefer crop_id over crop_name for queries
    let guidesQuery = supabase
      .from("crop_guides")
      .select("*")
      .eq("is_active", true)
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("step_number", { ascending: true });

    if (resolvedCropId) {
      guidesQuery = guidesQuery.eq("crop_id", resolvedCropId);
    } else if (crop_name) {
      guidesQuery = guidesQuery.eq("crop_name", crop_name);
    }

    const { data: guides, error: guidesError } = await guidesQuery;

    if (guidesError) {
      console.error("[GUIDE-QUERY] Error fetching guides:", guidesError);
      throw new Error("Failed to fetch guides");
    }

    if (!guides || guides.length === 0) {
      const notFoundMsg = language === 'ne' 
        ? "यो बाली/अवस्थाका लागि गाइड उपलब्ध छैन। कृपया अर्को विकल्प छान्नुहोस् वा पछि फेरि प्रयास गर्नुहोस्।"
        : "No guide available for this crop/stage. Please try another option or check back later.";
      
      return new Response(
        JSON.stringify({ 
          error: notFoundMsg,
          sections: {},
          summary: null,
          steps: null,
          crop: cropInfo
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group sections by type
    const sectionMap: Record<string, GuideSection[]> = {};
    for (const guide of guides) {
      if (!sectionMap[guide.section]) {
        sectionMap[guide.section] = [];
      }
      sectionMap[guide.section].push(guide);
    }

    // Build content for AI prompt
    const guideContent = guides.map(g => {
      const title = language === 'ne' && g.title_ne ? g.title_ne : g.title;
      const content = language === 'ne' && g.content_ne ? g.content_ne : g.content;
      return `### ${g.section}: ${title}\n${content}`;
    }).join("\n\n");

    // Generate AI summary using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.warn("[GUIDE-QUERY] LOVABLE_API_KEY not configured, returning guides without summary");
      return new Response(
        JSON.stringify({
          sections: sectionMap,
          raw_guides: guides,
          summary: null,
          steps: null,
          crop: cropInfo,
          matched_rule: matchedRule
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware prompt
    const cropDisplayName = cropInfo 
      ? (language === 'ne' ? cropInfo.name_ne : cropInfo.name_en)
      : crop_name;
    
    let userContext = `बाली: ${cropDisplayName}`;
    if (stage) userContext += `\nअवस्था: ${stage}`;
    if (problem_type) userContext += `\nसमस्या प्रकार: ${problem_type}`;
    if (severity) userContext += `\nगम्भीरता: ${severity}`;
    if (question) userContext += `\n\nकिसानको प्रश्न: ${question}`;
    else userContext += `\n\nयो बालीको सामान्य खेती सारांश दिनुहोस्।`;

    const systemPrompt = `तपाईं नेपाली किसानहरूको लागि अनुभवी कृषि विशेषज्ञ हुनुहुन्छ। तलको गाइड सामग्रीबाट किसानलाई विस्तृत र व्यावहारिक जवाफ दिनुहोस्।

तपाईंले दिनुपर्ने जवाफ ढाँचा:
1. पहिले ३-५ वाक्यको परिचय दिनुहोस् जसमा बालीको महत्त्व र सन्दर्भ समावेश गर्नुहोस्
2. "के गर्नुहोस्:" शीर्षकमा विस्तृत क्रमबद्ध चरणहरू (१., २., ३....)
   - प्रत्येक चरणमा कम्तिमा २-३ वाक्य लेख्नुहोस्
   - कहिले, कसरी, कति मात्रामा गर्ने स्पष्ट बनाउनुहोस्
   - नेपालको मौसम र स्थानीय अभ्यास जोड्नुहोस्
3. "थप सुझावहरू:" शीर्षकमा अतिरिक्त उपयोगी जानकारी
4. "सावधानी:" शीर्षकमा २-३ महत्त्वपूर्ण कुराहरू

नियमहरू:
- सरल नेपाली भाषा प्रयोग गर्नुहोस्, अंग्रेजी प्राविधिक शब्द मिलाउन सकिन्छ
- प्रत्येक बुँदामा विस्तृत व्याख्या दिनुहोस्, छोटो नबनाउनुहोस्
- व्यावहारिक उदाहरण र अनुभवमा आधारित सल्लाह दिनुहोस्
- तलको गाइड सामग्रीमा नभएको कुरा नबनाउनुहोस्
- emoji प्रयोग नगर्नुहोस्
- जवाफ कम्तिमा ५००-८०० शब्दको हुनुपर्छ

गाइड सामग्री:
${guideContent}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
        max_tokens: 3000,
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[GUIDE-QUERY] AI error:", aiResponse.status, errorText);
      
      // Return guides without summary on AI error
      return new Response(
        JSON.stringify({
          sections: sectionMap,
          raw_guides: guides,
          summary: null,
          steps: null,
          crop: cropInfo,
          matched_rule: matchedRule,
          error: aiResponse.status === 429 ? "Rate limit exceeded, try again later" : null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || null;

    // Parse steps from summary (extract numbered list items)
    let steps: string[] = [];
    if (summary) {
      const stepsMatch = summary.match(/(\d+\.\s+[^\n]+)/g);
      if (stepsMatch) {
        steps = stepsMatch.map((s: string) => s.replace(/^\d+\.\s*/, '').trim());
      }
    }

    console.log("[GUIDE-QUERY] Success for crop:", cropDisplayName, "sections:", Object.keys(sectionMap).length);

    return new Response(
      JSON.stringify({
        sections: sectionMap,
        raw_guides: guides,
        summary,
        steps,
        crop: cropInfo,
        matched_rule: matchedRule
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[GUIDE-QUERY] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
