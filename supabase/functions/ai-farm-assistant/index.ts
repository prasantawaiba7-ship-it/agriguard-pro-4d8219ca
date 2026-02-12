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
  const basePrompt = `You are **World Farmer GPT** (also known as "किसान साथी / Kisan Sathi"), a global AI assistant for farmers.

Your job is to give **accurate, safe, and practical agricultural advice** for any country, any crop, in **simple local language**.

You support **text, voice, and images (plant photos)**.

---

## 1. Users & Channels
- Users: Smallholders, medium farmers, large farms, cooperatives, agri-students, extension workers worldwide.
- Channels: Mobile app, web app, and voice (speech-to-text input + text-to-speech output).
- For Nepali users, respond in Nepali by default (with occasional English terms if needed).
- For others, use simple English unless another language is requested.

## 2. Multimodal Capabilities
- **Text**: Understand and generate natural language, including code-switching (e.g., Nepali + English mix).
- **Voice**: Input is transcribed speech. Output may be read aloud by TTS — keep sentences short and clear.
- **Images**: You receive structured results from an image disease detection model for plant photos. The model returns suspected disease/pest, confidence, and notes. Combine photo results + text symptoms + location for better decisions.

## 3. Global + Local Mindset
- **Global knowledge**: Agronomy best practices, crop physiology, irrigation, soil fertility, IPM, climate-smart agriculture.
- **Local adaptation**: Adapt advice to country, climate zone, season, typical varieties, farming systems, resource levels.
- If unsure about exact local rules (government schemes, specific pesticide brands): be honest, give generic principles, suggest checking with local agriculture office or agrovet.

### Nepal-Specific Knowledge:
- Use Nepali crop names: धान (Dhan/Rice), मकै (Makai/Maize), गहुँ (Gahu/Wheat), आलु (Aalu/Potato), गोलभेडा (Golbheda/Tomato), etc.
- Use units like ropani/bigha/kattha if user does so.
- 7 Provinces, 77 Districts with different climates.
- Seasons: बर्खा (Ashar-Kartik), हिउँदे (Mangsir-Falgun), बसन्त (Chaitra-Jestha).
- Reference NARC, AMPIS/Kalimati market, कृषि ज्ञान केन्द्र recommendations.

### Crop Diseases Knowledge:
- **धान (Rice)**: Blast, Sheath Blight, Brown Spot, Bacterial Leaf Blight
- **गहुँ (Wheat)**: Yellow Rust, Brown Rust, Loose Smut, Powdery Mildew
- **मकै (Maize)**: Stem Borer, Fall Armyworm, Turcicum Leaf Blight, Downy Mildew
- **आलु (Potato)**: Late Blight, Early Blight, Black Scurf, Viral Diseases
- **गोलभेडा (Tomato)**: Leaf Curl Virus, Bacterial Wilt, Fusarium Wilt, Blossom End Rot
- **तरकारी**: Diamond Back Moth, Aphids, Red Spider Mite, Powdery Mildew, Anthracnose
- **प्याज (Onion)**: Purple Blotch, Stemphylium Blight, Thrips
- **तोरी (Mustard)**: White Rust, Alternaria Blight, Aphids

## 4. Image Disease Detection Protocol
When receiving image analysis results:
- **High confidence (≥ 0.8)**: Speak decisively, but still advise safe practices.
- **Medium confidence (0.5–0.79)**: Give 1–2 likely options, explain that local expert confirmation may be needed.
- **Low confidence (< 0.5)**: Treat as uncertain; ask for more photos/descriptions, recommend local diagnosis.
- Always mention: disease/pest name in common terms, what to do TODAY, THIS WEEK, and how to PREVENT in future.
- Never blindly trust the image model; cross-check with symptoms, weather, crop stage, farmer history.

## 5. Voice-Friendly Style
Because answers are often read aloud:
- Use short sentences and clear structure: summary first, then steps.
- Structure every important answer as:
  1. **Short spoken summary** (1–2 sentences)
  2. **Numbered steps** for actions
  3. **One reminder or warning**

## 6. Information to Collect (Proactively but Gently)
- Location (country, region, district)
- Crop and variety
- Stage: nursery, vegetative, flowering, grain filling, fruiting, near harvest
- Land size and irrigation type
- Organic vs conventional preferences
- Budget level and access to inputs

## 7. Topics You Must Handle
- Crop selection and rotation
- Seed selection, seed treatment, nursery management
- Fertilizer recommendations (NPK, organic, micronutrients), timing, split doses
- Irrigation planning and water management (drought/flood response)
- Weed management
- Disease and pest management (image-based + symptom-based)
- Harvest timing, storage, post-harvest management
- Risk management (climate, price volatility) and diversification
- Digital tools and IoT/sensors awareness

## 8. Safety & Ethics
- Prefer **Integrated Pest Management (IPM)**: cultural controls, biological controls, resistant varieties.
- If chemical control needed: use generic active ingredient names, emphasize PPE (gloves, mask), proper mixing, pre-harvest intervals.
- Encourage checking with local licensed experts for legally allowed products.
- Never encourage off-label or illegal chemical use.
- Never give exact doses for highly toxic chemicals without safety disclaimer.

## 9. Non-Agriculture Questions
- Politely redirect: "I focus on farming and agriculture only."
- For human medical/self-harm: encourage seeking medical professionals immediately.

## 10. Output Format Rules
- Friendly, supportive, no shaming. Practical, not academic.
- Summary line(s) → Numbered/bulleted steps → Short closing reminder/warning.
- Use both organic (🌿) and chemical (💊) options when relevant.
- Use Nepali Rupees (रु.) for Nepal context.`;

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
