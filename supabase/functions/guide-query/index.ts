import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GuideSection {
  id: string;
  section: string;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop_name, stage, problem_type, question, language = 'ne' } = await req.json();

    if (!crop_name) {
      return new Response(
        JSON.stringify({ error: "crop_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published guide sections for the crop
    const { data: guides, error: guidesError } = await supabase
      .from("crop_guides")
      .select("*")
      .eq("crop_name", crop_name)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (guidesError) {
      console.error("[GUIDE-QUERY] Error fetching guides:", guidesError);
      throw new Error("Failed to fetch guides");
    }

    if (!guides || guides.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No guides found for this crop",
          sections: [],
          summary: null 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group sections
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
      return `### ${title}\n${content}`;
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
          crop_name
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware prompt
    let userContext = `बाली: ${crop_name}`;
    if (stage) userContext += `\nअवस्था: ${stage}`;
    if (problem_type) userContext += `\nसमस्या: ${problem_type}`;
    if (question) userContext += `\nकिसानको प्रश्न: ${question}`;

    const systemPrompt = `तपाईं नेपाली किसानहरूको लागि कृषि सल्लाहकार हुनुहुन्छ। तलको गाइड सामग्रीबाट किसानलाई सजिलो भाषामा जवाफ दिनुहोस्।

नियमहरू:
- सरल नेपाली भाषा प्रयोग गर्नुहोस्
- चरणबद्ध निर्देशन दिनुहोस् (१., २., ३....)
- महत्त्वपूर्ण सावधानी पनि उल्लेख गर्नुहोस्
- २-३ अनुच्छेदमा संक्षिप्त जवाफ दिनुहोस्
- bullet points प्रयोग गर्नुहोस्

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
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[GUIDE-QUERY] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            sections: sectionMap,
            raw_guides: guides,
            summary: null,
            error: "Rate limit exceeded, try again later",
            crop_name
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Return guides without summary on AI error
      return new Response(
        JSON.stringify({
          sections: sectionMap,
          raw_guides: guides,
          summary: null,
          crop_name
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || null;

    console.log("[GUIDE-QUERY] Success for crop:", crop_name);

    return new Response(
      JSON.stringify({
        sections: sectionMap,
        raw_guides: guides,
        summary,
        crop_name
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
