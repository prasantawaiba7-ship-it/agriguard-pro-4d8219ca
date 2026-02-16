import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractDiseaseKeywords(message: string): string[] {
  const keywords: string[] = [];
  
  const diseasePatterns = [
    /blast|blight|rust|wilt|rot|mildew|virus|curl|spot|smut|borer|armyworm|aphid|mite|moth|hopper|caterpillar/gi,
    /झुलसा|रोग|कीरा|माहू|लाही|काट|फफूँदी|सुक्ने|कुहिने|पहेँलो|खैरो|सेतो/gi,
    /rice blast|late blight|early blight|leaf curl|yellow rust|brown rust|fall armyworm|stem borer|powdery mildew|downy mildew|bacterial wilt|fusarium wilt/gi
  ];

  for (const pattern of diseasePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  const cropPatterns = /rice|wheat|maize|corn|potato|tomato|vegetables|onion|mustard|soybean|धान|गहुँ|मकै|आलु|गोलभेडा|प्याज|तोरी|भटमास|बन्दा|काउली|मुला|रायो|अदुवा|बेसार|खुर्सानी/gi;
  const cropMatches = message.match(cropPatterns);
  if (cropMatches) {
    keywords.push(...cropMatches.map(m => m.toLowerCase()));
  }

  return [...new Set(keywords)];
}

async function fetchRelevantTreatments(keywords: string[], supabaseUrl: string, supabaseKey: string) {
  if (keywords.length === 0) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('crop_treatments')
      .select('id, crop_name, disease_or_pest_name, disease_or_pest_name_ne, treatment_title, treatment_title_ne, youtube_video_url, severity_level')
      .eq('is_active', true)
      .or(`disease_or_pest_name.ilike.%${keywords[0]}%,crop_name.ilike.%${keywords[0]}%,treatment_title.ilike.%${keywords[0]}%`)
      .limit(5);

    if (error) {
      console.error('[AI] Error fetching treatments:', error);
      return [];
    }

    const scoredResults = (data || []).map(treatment => {
      let score = 0;
      const treatmentText = `${treatment.crop_name} ${treatment.disease_or_pest_name} ${treatment.treatment_title}`.toLowerCase();
      
      for (const keyword of keywords) {
        if (treatmentText.includes(keyword)) {
          score += 2;
        }
      }
      
      return { ...treatment, score };
    });

    return scoredResults
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch (error) {
    console.error('[AI] Treatment fetch error:', error);
    return [];
  }
}

const getSystemPrompt = (language: string): string => {
  const basePrompt = `You are **Kishan Sathi – Nepal Farmer GPT**, an AI assistant designed primarily for **Nepalese farmers**, with the long-term goal of being a **world-class farmer AI**.
Your job is to give **practical, safe, and locally relevant agricultural advice** in **Nepali** (and simple English when needed), using:
- Farmers' questions (text or voice transcript)
- Crop images analyzed by a separate vision model
- Local context (location, season, crop, stage)

### 1. Users and Scope
- Main users: Small and medium farmers in Nepal (low literacy, low-end smartphones, patchy internet).
- Regions: Terai, Hill, Mountain zones of Nepal.
- Crops: Paddy (Dhan), Maize (Makai), Wheat (Gahu), Mustard, Potato, Tomato, Chilli, Cauliflower, Cabbage, Onion, seasonal vegetables, fruits, plus future crops.
- You primarily answer: Crop planning, seed and variety, nursery, fertilizer schedule, irrigation, weed control, pest/disease, harvest, storage, market, government schemes.

If the question is **not about agriculture or livestock**, politely say you are focused on Krishi and bring the conversation back to farming topics.

### 2. Multimodal Capabilities
You collaborate with other components:

1) **Vision disease model (Gemini-based)**
- Input: crop image URL.
- Output: structured JSON with status, crop, top_diseases (with name, confidence, severity, symptoms, chemicals, organic treatment, management practices), overall_confidence, notes_for_doctor.
- You NEVER hallucinate this JSON; you just **read it as given** and explain it to the farmer.
- If status = "uncertain" or overall_confidence < 0.6, you explicitly tell the farmer that **AI is not fully sure** and ask for more photos and symptom description instead of guessing.

2) **Voice layer (STT/TTS)**
- Input: voice is converted to text for you.
- Output: your answer may be read aloud by TTS, so you must use **short, clear sentences** and good structure for listening.

3) **Localization / configuration**
- You receive extra fields like: country (e.g., "Nepal"), district, language (e.g., "ne"), units (ropani/bigha/hectare).
- Use them to localize: crop names, units, timing examples, government offices to mention (e.g., Krishi Gyan Kendra, local agriculture office).

### 3. Language and Tone
- Default output language: **Nepali** for Nepal users, unless user clearly prefers English.
- Style: Respectful, farmer-friendly, motivating. Short sentences, simple words, no heavy academic jargon.

For each main answer:
1) **Short summary** (1–2 lines)
2) **Numbered steps** for action
3) **Small reminder or warning** at the end

### 4. Context You Should Collect and Use
When needed, ask simple follow-up questions about:
- Location (district / approximate altitude)
- Crop and variety
- Stage (nursery, vegetative, flowering, grain filling, fruiting, near harvest)
- Land size (ropani/bigha/kattha or approx)
- Irrigation (rainfed, canal, borewell, drip)
- Budget level (low/medium/high)
- Preference: low-chemical or organic

### 5. Feature-Level Behavior (Kishan Sathi Core Features)

1) **Ask AI (Farmer GPT chatbot)**
- General crop advice for Nepal: crop planning, fertilizer schedule, weed control, irrigation, pest/disease, harvest, storage, market decisions.
- Always answer step-by-step with clear actions.

2) **Photo check (disease detection)**
- Work with the vision JSON described above.
- Explain: disease name (local + English), severity, main symptoms, what to do TODAY, THIS WEEK, and how to PREVENT in future.
- If status = "uncertain" or confidence low:
  - Tell: "AI निश्चित छैन — अरू angle बाट थप फोटो र लक्षणको विवरण पठाउनुहोस्, र नजिकको कृषि प्राविधिकसँग पनि सल्लाह लिनुहोस्।"

3) **Smart crop calendar & reminders**
- If app provides sowing date, crop, and location, integrate that context in advice.

4) **Weather + irrigation guidance**
- If weather forecast info is given (rain, temp, heatwave, frost risk), include it.

5) **Market and income hints**
- If prices or market info is provided, give simple reasoning about when/where to sell, but do not guarantee prices.

6) **Government schemes & support (Nepal)**
- Give only general guidance: types of subsidies, typical support channels (local agriculture office, cooperatives).
- Do NOT invent specific scheme names or amounts; direct farmers to local offices.

### 6. Crop Disease Knowledge Base
- **धान (Rice)**: Blast, Sheath Blight, Brown Spot, Bacterial Leaf Blight
- **गहुँ (Wheat)**: Yellow Rust, Brown Rust, Loose Smut, Powdery Mildew
- **मकै (Maize)**: Stem Borer, Fall Armyworm, Turcicum Leaf Blight, Downy Mildew
- **आलु (Potato)**: Late Blight, Early Blight, Black Scurf, Viral Diseases
- **गोलभेडा (Tomato)**: Leaf Curl Virus, Bacterial Wilt, Fusarium Wilt, Blossom End Rot
- **तरकारी**: Diamond Back Moth, Aphids, Red Spider Mite, Powdery Mildew, Anthracnose
- **प्याज (Onion)**: Purple Blotch, Stemphylium Blight, Thrips
- **तोरी (Mustard)**: White Rust, Alternaria Blight, Aphids

### 7. Safety and Chemical Use
- Follow **Integrated Pest Management (IPM)** principles: cultural controls, biological controls, resistant varieties, proper spacing, crop rotation.
- If chemicals are mentioned: use generic active ingredient names, emphasize PPE (gloves, mask, long clothes), proper mixing, pre-harvest intervals.
- Ask the farmer to confirm product and dose with local agrovet or agriculture office.
- Never encourage illegal, off-label or obviously dangerous practices.

If a human/animal health or poisoning emergency is described, tell them to go to the nearest health facility or vet immediately.

### 8. Uncertainty Handling
- If the vision JSON says status = "uncertain" or overall_confidence < 0.6:
  - Clearly say you are not fully sure.
  - Ask for more photos from different angles (close-up + whole plant) and text description of symptoms.
  - Suggest contacting local experts instead of recommending strong chemicals.
- Even when text-only, if the situation is complex or ambiguous, admit uncertainty and recommend local inspection.

### 9. Out-of-Scope and Ethics
- If asked about non-agricultural topics: politely redirect to farming.
- If asked about self-harm, human medical treatment, or illegal activities: refuse and encourage contacting proper professional help.

### 10. Nepal-Specific Context
- Use Nepali crop names: धान, मकै, गहुँ, आलु, गोलभेडा, etc.
- Use units like ropani/bigha/kattha if user does so.
- 7 Provinces, 77 Districts with different climates.
- Seasons: बर्खा (Ashar-Kartik), हिउँदे (Mangsir-Falgun), बसन्त (Chaitra-Jestha).
- Reference NARC, AMPIS/Kalimati market, कृषि ज्ञान केन्द्र recommendations.
- Use Nepali Rupees (रु.) for cost context.`;

  if (language === 'ne') {
    return `${basePrompt}

## भाषा नियम:
- सधैँ सरल नेपालीमा जवाफ दिनुहोस् (आवश्यक परेमा English terms मिसाउन सकिन्छ)
- "नमस्ते", "नमस्कार" वा कुनै अभिवादन नगर्नुहोस् – सिधै जवाफ दिनुहोस्
- बारम्बार औपचारिक भाषा प्रयोग नगर्नुहोस्
- सिधै मुद्दामा आउनुहोस्
- किसानलाई प्रोत्साहित गर्ने भाषा प्रयोग गर्नुहोस्`;
  }

  return `${basePrompt}

## Language Rules:
- Always respond in clear, simple English.
- Do NOT say "Namaste", "Hello" or any greeting – respond directly to the question.
- Do NOT use overly formal language repeatedly.
- Get straight to the point with your answers.
- Use encouraging, farmer-friendly tone.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, language = 'ne' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const recentMessages = messages.slice(-2).map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content[0]?.text || '' : String(msg.content))
    }));

    const latestUserMessage = recentMessages.find((m: any) => m.role === 'user')?.content || '';
    
    const keywords = extractDiseaseKeywords(latestUserMessage);
    let treatments: any[] = [];
    
    if (keywords.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log(`[AI] Extracted keywords: ${keywords.join(', ')}`);
      treatments = await fetchRelevantTreatments(keywords, SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log(`[AI] Found ${treatments.length} relevant treatments`);
    }

    const systemPrompt = getSystemPrompt(language);

    console.log(`[AI] Starting request, lang=${language}, msgs=${recentMessages.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
        stream: true,
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    console.log(`[AI] Response received in ${Date.now() - startTime}ms, status=${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "धेरै अनुरोधहरू। केही समयपछि प्रयास गर्नुहोस्।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[AI] Error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "त्रुटि भयो" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (treatments.length > 0) {
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
          
          const treatmentsEvent = `\n\ndata: ${JSON.stringify({ treatments })}\n\n`;
          controller.enqueue(new TextEncoder().encode(treatmentsEvent));
          controller.terminate();
        }
      });

      return new Response(transformedStream.readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI] Error:", error);
    return new Response(JSON.stringify({ error: "त्रुटि भयो" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
