import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Bilingual Function Registry (inline for Deno edge function) ─────

type SupportedLanguage = "ne" | "en";
type FunctionCategory =
  | "disease_support" | "fertilizer_support" | "crop_planning"
  | "weather_advice" | "market_price" | "general_qa"
  | "call_request" | "admin_help" | "soil_support"
  | "irrigation_advice" | "livestock_support";

interface BilingualText { ne: string; en: string; }
interface KSFunction {
  id: string;
  category: FunctionCategory;
  title: BilingualText;
  description: BilingualText;
  output_template: BilingualText;
}

const FUNCTIONS: KSFunction[] = [
  { id: "crop_disease_expert", category: "disease_support",
    title: { ne: "बाली रोग विशेषज्ञ सुझाव", en: "Crop Disease Expert Advice" },
    description: { ne: "फोटो, स्थान र लक्षणको आधारमा रोग र प्रबन्धन सुझाव।", en: "Disease and management suggestions based on photo, location, symptoms." },
    output_template: { ne: "बाली: {{crop}}\nसम्भावित रोग: {{disease_name}}\nप्रबन्धन:\n{{management_steps}}", en: "Crop: {{crop}}\nPossible disease: {{disease_name}}\nManagement:\n{{management_steps}}" } },
  { id: "pest_management_ipm", category: "disease_support",
    title: { ne: "कीरा व्यवस्थापन (IPM)", en: "Pest Management (IPM)" },
    description: { ne: "एकीकृत कीरा व्यवस्थापन सिद्धान्त अनुसार कीरा नियन्त्रण।", en: "Pest control following IPM principles." },
    output_template: { ne: "बाली: {{crop}} | कीरा: {{pest_name}}\nIPM उपायहरू:\n{{steps}}", en: "Crop: {{crop}} | Pest: {{pest_name}}\nIPM measures:\n{{steps}}" } },
  { id: "fertilizer_dose_calculator", category: "fertilizer_support",
    title: { ne: "मल मात्रा सुझाव", en: "Fertilizer Dose Recommendation" },
    description: { ne: "बालीको प्रकार र जमिन अनुसार मल सुझाव।", en: "Fertilizer recommendation based on crop and land." },
    output_template: { ne: "बाली: {{crop}}\nमल तालिका:\n{{schedule}}", en: "Crop: {{crop}}\nFertilizer schedule:\n{{schedule}}" } },
  { id: "sowing_harvesting_planner", category: "crop_planning",
    title: { ne: "रोपाइ / कटनी समय योजना", en: "Sowing & Harvesting Planner" },
    description: { ne: "जिल्ला र जलवायु अनुसार रोप्ने र काट्ने समय।", en: "Sowing and harvesting times by district and climate." },
    output_template: { ne: "बाली: {{crop}}\nरोपाइ: {{sowing}}\nकटनी: {{harvest}}", en: "Crop: {{crop}}\nSowing: {{sowing}}\nHarvest: {{harvest}}" } },
  { id: "crop_recommendation", category: "crop_planning",
    title: { ne: "बाली सिफारिस", en: "Crop Recommendation" },
    description: { ne: "जमिन, मौसम र बजार अवसर अनुसार बाली छनोट।", en: "Crop selection based on land, season, market." },
    output_template: { ne: "सिफारिस बालीहरू:\n{{crop_list}}", en: "Recommended crops:\n{{crop_list}}" } },
  { id: "weather_irrigation_advisor", category: "weather_advice",
    title: { ne: "मौसम र सिँचाइ सल्लाह", en: "Weather & Irrigation Advice" },
    description: { ne: "मौसम अनुसार सिँचाइ र खेत व्यवस्थापन सुझाव।", en: "Irrigation and field management by weather." },
    output_template: { ne: "📍 {{district}}\nसिँचाइ: {{advice}}", en: "📍 {{district}}\nIrrigation: {{advice}}" } },
  { id: "market_price_info", category: "market_price",
    title: { ne: "बजार मूल्य जानकारी", en: "Market Price Information" },
    description: { ne: "बालीको हालको बजार मूल्य र बेच्ने सुझाव।", en: "Current market prices and selling advice." },
    output_template: { ne: "बाली: {{crop}}\nमूल्य: रु. {{price}}", en: "Crop: {{crop}}\nPrice: Rs. {{price}}" } },
  { id: "general_agri_qa", category: "general_qa",
    title: { ne: "सामान्य कृषि प्रश्न", en: "General Agricultural Question" },
    description: { ne: "कृषिसम्बन्धी कुनै पनि प्रश्नको जवाफ।", en: "Answer to any agriculture question." },
    output_template: { ne: "{{answer}}", en: "{{answer}}" } },
  { id: "expert_connect_request", category: "call_request",
    title: { ne: "विशेषज्ञसँग कुरा गर्ने अनुरोध", en: "Request Expert Consultation" },
    description: { ne: "कृषि विज्ञसँग कल/च्याट अनुरोध।", en: "Request call/chat with agricultural expert." },
    output_template: { ne: "✅ अनुरोध दर्ता भयो।", en: "✅ Request submitted." } },
  { id: "soil_health_advisor", category: "soil_support",
    title: { ne: "माटो स्वास्थ्य सल्लाह", en: "Soil Health Advisory" },
    description: { ne: "माटो सुधार सुझाव।", en: "Soil improvement suggestions." },
    output_template: { ne: "माटो: {{soil_type}}\nसुधार:\n{{steps}}", en: "Soil: {{soil_type}}\nImprovement:\n{{steps}}" } },
  { id: "post_harvest_storage", category: "general_qa",
    title: { ne: "कटनी पछिको भण्डारण", en: "Post-Harvest Storage Guide" },
    description: { ne: "भण्डारण र प्रशोधन सुझाव।", en: "Storage and processing tips." },
    output_template: { ne: "बाली: {{crop}}\nभण्डारण:\n{{method}}", en: "Crop: {{crop}}\nStorage:\n{{method}}" } },
  { id: "admin_troubleshooting", category: "admin_help",
    title: { ne: "प्रशासन सहायता", en: "Admin & Troubleshooting" },
    description: { ne: "प्रणाली प्रयोग वा प्राविधिक समस्या सहायता।", en: "System usage or technical help." },
    output_template: { ne: "समाधान:\n{{steps}}", en: "Resolution:\n{{steps}}" } },
];

// ─── Language Detection ──────────────────────────────────

const DEVANAGARI = /[\u0900-\u097F]/;

function detectLanguage(text: string): SupportedLanguage {
  const chars = text.replace(/\s+/g, "");
  if (!chars.length) return "ne";
  let devCount = 0;
  for (const ch of chars) { if (DEVANAGARI.test(ch)) devCount++; }
  if (devCount / chars.length > 0.3) return "ne";
  const nepaliRoman = ["mero","khet","bali","rog","kira","mal","dhan","makai","gahu","aalu","golbheda","mausam","paani","bazar","kattha","ropani","bigha","krishi","kisan"];
  const lower = text.toLowerCase();
  if (nepaliRoman.filter(kw => lower.includes(kw)).length >= 2) return "ne";
  return "en";
}

// ─── Intent Classification ───────────────────────────────

const INTENT_PATTERNS: { category: FunctionCategory; keywords: string[] }[] = [
  { category: "disease_support", keywords: ["rog","disease","blight","blast","rust","wilt","rot","virus","kira","pest","insect","aphid","borer","armyworm","रोग","कीरा","झुलसा","माहू","फफूँदी","symptom","लक्षण","leaf","spot","photo","फोटो","diagnos","पहिचान"] },
  { category: "fertilizer_support", keywords: ["fertilizer","urea","dap","potash","compost","manure","मल","युरिया","डीएपी","dose","मात्रा","कति","how much","schedule"] },
  { category: "crop_planning", keywords: ["sow","plant","harvest","seed","variety","nursery","रोप","बिउ","काट","जात","when to","कहिले","recommend","सिफारिस","crop plan"] },
  { category: "weather_advice", keywords: ["weather","rain","frost","temperature","irrigation","मौसम","पानी","वर्षा","सिँचाइ","forecast","पूर्वानुमान"] },
  { category: "market_price", keywords: ["price","market","sell","rate","mandi","मूल्य","बजार","बेच","दर","कालिमाटी"] },
  { category: "call_request", keywords: ["expert","call","talk","consult","technician","विज्ञ","कल","सम्पर्क","प्राविधिक","phone"] },
  { category: "soil_support", keywords: ["soil","माटो","ph","nutrient","पोषक","compost","test","जाँच"] },
  { category: "admin_help", keywords: ["admin","setting","app","bug","error","प्रशासन","सेटिङ","समस्या","ticket","टिकट"] },
];

function classifyIntent(message: string): { category: FunctionCategory; confidence: number } {
  const lower = message.toLowerCase();
  const scores: Record<string, number> = {};
  for (const p of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of p.keywords) {
      if (lower.includes(kw.toLowerCase())) score += kw.length > 3 ? 2 : 1;
    }
    if (score > 0) scores[p.category] = score;
  }
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0) return { category: entries[0][0] as FunctionCategory, confidence: Math.min(entries[0][1] / 10, 1) };
  return { category: "general_qa", confidence: 0.3 };
}

function routeMessage(userMessage: string, langPref: SupportedLanguage | "auto") {
  const detectedLang = detectLanguage(userMessage);
  const resolvedLanguage: SupportedLanguage = langPref === "auto" ? detectedLang : langPref;
  const { category, confidence } = classifyIntent(userMessage);
  const candidates = FUNCTIONS.filter(f => f.category === category);
  const selected = candidates.length > 0 ? candidates[0] : FUNCTIONS.find(f => f.id === "general_agri_qa")!;
  return { selected, resolvedLanguage, confidence };
}

// ─── Disease keyword extraction & treatment fetch (existing logic) ───

function extractDiseaseKeywords(message: string): string[] {
  const keywords: string[] = [];
  const patterns = [
    /blast|blight|rust|wilt|rot|mildew|virus|curl|spot|smut|borer|armyworm|aphid|mite|moth|hopper|caterpillar/gi,
    /झुलसा|रोग|कीरा|माहू|लाही|काट|फफूँदी|सुक्ने|कुहिने|पहेँलो|खैरो|सेतो/gi,
    /rice blast|late blight|early blight|leaf curl|yellow rust|brown rust|fall armyworm|stem borer|powdery mildew|downy mildew|bacterial wilt|fusarium wilt/gi
  ];
  for (const p of patterns) { const m = message.match(p); if (m) keywords.push(...m.map(x => x.toLowerCase())); }
  const cropP = /rice|wheat|maize|corn|potato|tomato|vegetables|onion|mustard|soybean|धान|गहुँ|मकै|आलु|गोलभेडा|प्याज|तोरी|भटमास|बन्दा|काउली|मुला|रायो|अदुवा|बेसार|खुर्सानी/gi;
  const cm = message.match(cropP);
  if (cm) keywords.push(...cm.map(x => x.toLowerCase()));
  return [...new Set(keywords)];
}

async function fetchRelevantTreatments(keywords: string[], supabaseUrl: string, supabaseKey: string) {
  if (!keywords.length) return [];
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('crop_treatments')
      .select('id, crop_name, disease_or_pest_name, disease_or_pest_name_ne, treatment_title, treatment_title_ne, youtube_video_url, severity_level')
      .eq('is_active', true)
      .or(`disease_or_pest_name.ilike.%${keywords[0]}%,crop_name.ilike.%${keywords[0]}%,treatment_title.ilike.%${keywords[0]}%`)
      .limit(5);
    if (error) { console.error('[AI] treatments error:', error); return []; }
    return (data || []).map(t => {
      const txt = `${t.crop_name} ${t.disease_or_pest_name} ${t.treatment_title}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) { if (txt.includes(kw)) score += 2; }
      return { ...t, score };
    }).filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  } catch (e) { console.error('[AI] treatment fetch error:', e); return []; }
}

// ─── System Prompt Builder ───────────────────────────────

function buildSystemPrompt(resolvedLanguage: SupportedLanguage, selectedFunction: KSFunction): string {
  const basePrompt = `You are **Kishan Sathi – Nepal Farmer GPT**, an AI assistant for farmers.
Your current task context: **${selectedFunction.title.en}** (${selectedFunction.title.ne})
Description: ${selectedFunction.description[resolvedLanguage]}

Use this guiding output structure (adapt as needed):
${selectedFunction.output_template[resolvedLanguage]}

### Core Rules:
- Users: Small and medium farmers in Nepal (low literacy, low-end smartphones).
- Regions: Terai, Hill, Mountain zones of Nepal.
- Crops: Paddy, Maize, Wheat, Mustard, Potato, Tomato, Chilli, Cauliflower, Cabbage, Onion, vegetables, fruits.
- You answer: Crop planning, seed, nursery, fertilizer, irrigation, weed control, pest/disease, harvest, storage, market, government schemes.
- If question is NOT about agriculture/livestock, politely redirect to farming.

### Multimodal:
- Vision disease model provides structured JSON. Read it as-given, explain to farmer.
- If status="uncertain" or confidence < 0.6, tell farmer AI is not sure and ask for more photos.
- Voice layer: use short, clear sentences for TTS.

### Language & Tone:
- Use Nepal-specific crop names, units (ropani/bigha/kattha), Nepali Rupees.
- Reference NARC, Kalimati market, कृषि ज्ञान केन्द्र.
- 7 Provinces, 77 Districts.
- Seasons: बर्खा (Ashar-Kartik), हिउँदे (Mangsir-Falgun), बसन्त (Chaitra-Jestha).

### Response format:
1) Short summary (1–2 lines)
2) Numbered action steps
3) Small reminder/warning at end

### Safety:
- Follow IPM: cultural → biological → chemical (last resort).
- Use generic active ingredient names, emphasize PPE, pre-harvest intervals.
- Never encourage illegal/dangerous practices.
- Health emergency → go to nearest health facility.

### Uncertainty:
- If unsure, admit it. Ask for more info. Suggest contacting local expert.`;

  if (resolvedLanguage === 'ne') {
    return `${basePrompt}

## भाषा नियम:
- सधैँ सरल नेपालीमा जवाफ दिनुहोस् (आवश्यक परेमा English terms मिसाउन सकिन्छ, जस्तै "Blight (झुलसा)")
- अभिवादन नगर्नुहोस् – सिधै जवाफ दिनुहोस्
- सिधै मुद्दामा आउनुहोस्
- किसानलाई प्रोत्साहित गर्ने भाषा प्रयोग गर्नुहोस्`;
  }

  return `${basePrompt}

## Language Rules:
- Always respond in clear, simple English.
- Include Nepali terms in parentheses when helpful, e.g., "Blight (झुलसा)"
- No greetings – respond directly.
- Use encouraging, farmer-friendly tone.`;
}

// ─── Main Handler ────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, language = 'auto' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract latest user message for routing
    const recentMessages = messages.slice(-6).map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content[0]?.text || '' : String(msg.content))
    }));

    const latestUserMessage = [...recentMessages].reverse().find((m: any) => m.role === 'user')?.content || '';

    // ─── AI Router: detect language + classify intent + select function ───
    const { selected, resolvedLanguage, confidence } = routeMessage(latestUserMessage, language as SupportedLanguage | "auto");
    console.log(`[AI Router] function=${selected.id}, lang=${resolvedLanguage}, confidence=${confidence.toFixed(2)}`);

    // ─── Fetch relevant treatments if disease-related ───
    const keywords = extractDiseaseKeywords(latestUserMessage);
    let treatments: any[] = [];
    if (keywords.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log(`[AI] Keywords: ${keywords.join(', ')}`);
      treatments = await fetchRelevantTreatments(keywords, SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log(`[AI] Found ${treatments.length} treatments`);
    }

    // ─── Build bilingual system prompt ───
    const systemPrompt = buildSystemPrompt(resolvedLanguage, selected);

    // ─── Add treatment context if available ───
    let treatmentContext = "";
    if (treatments.length > 0) {
      treatmentContext = "\n\n### Relevant treatments from our database (use this info in your answer):\n" +
        treatments.map(t => `- ${t.disease_or_pest_name} (${t.disease_or_pest_name_ne || ''}): ${t.treatment_title} (${t.treatment_title_ne || ''})${t.youtube_video_url ? ` [Video: ${t.youtube_video_url}]` : ''}`).join("\n");
    }

    console.log(`[AI] Request: lang=${resolvedLanguage}, func=${selected.id}, msgs=${recentMessages.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + treatmentContext },
          ...recentMessages,
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    console.log(`[AI] Response in ${Date.now() - startTime}ms, status=${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        const errMsg = resolvedLanguage === 'ne'
          ? "धेरै अनुरोधहरू। केही समयपछि प्रयास गर्नुहोस्।"
          : "Too many requests. Please try again shortly.";
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        const errMsg = resolvedLanguage === 'ne'
          ? "AI सेवा क्रेडिट सकियो।"
          : "AI service credits exhausted.";
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[AI] Error:", response.status, errorText);
      const errMsg = resolvedLanguage === 'ne' ? "त्रुटि भयो" : "An error occurred";
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Stream response, append routing metadata + treatments at end ───
    const originalStream = response.body;
    const transformedStream = new TransformStream({
      async start(controller) {
        if (originalStream) {
          const reader = originalStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }
        }

        // Append metadata event with routing info + treatments
        const metadata: any = {
          routed_function: selected.id,
          routed_language: resolvedLanguage,
          intent_confidence: confidence,
        };
        if (treatments.length > 0) {
          metadata.treatments = treatments;
        }
        const metaEvent = `\n\ndata: ${JSON.stringify(metadata)}\n\n`;
        controller.enqueue(new TextEncoder().encode(metaEvent));
        controller.terminate();
      }
    });

    return new Response(transformedStream.readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI] Error:", error);
    return new Response(JSON.stringify({ error: "An error occurred / त्रुटि भयो" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
