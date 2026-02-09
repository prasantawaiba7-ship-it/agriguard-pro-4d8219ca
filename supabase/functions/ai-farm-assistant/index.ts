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
  const baseKnowledge = `
## तपाईँको ज्ञान र क्षमताहरू:

### बाली रोगहरू (Crop Diseases):
- **धान (Rice)**: Blast (ब्लास्ट), Sheath Blight (शिथ ब्लाइट), Brown Spot (खैरो थोप्ला), Bacterial Leaf Blight (ब्याक्टेरियल पात झुलसा)
- **गहुँ (Wheat)**: Yellow Rust (पहेँलो रतुवा), Brown Rust (खैरो रतुवा), Loose Smut (खुला कन्डुवा), Powdery Mildew (छाछ्या)
- **मकै (Maize)**: Stem Borer (गोडे कीरा), Fall Armyworm (फल आर्मीवर्म), Turcicum Leaf Blight, Downy Mildew (मृदुरोमिल फफूँदी)
- **आलु (Potato)**: Late Blight (ढिलो झुलसा), Early Blight (चाँडो झुलसा), Black Scurf, Viral Diseases
- **गोलभेडा (Tomato)**: Leaf Curl Virus (पात कुर्चिने भाइरस), Bacterial Wilt (ब्याक्टेरियल ओइलाउने), Fusarium Wilt, Blossom End Rot
- **तरकारी**: Diamond Back Moth, माहू (Aphids), Red Spider Mite, Powdery Mildew, Anthracnose
- **प्याज (Onion)**: Purple Blotch (बैजनी थोप्ला), Stemphylium Blight, Thrips (थ्रिप्स)
- **तोरी (Mustard)**: White Rust (सेतो रतुवा), Alternaria Blight, माहू

### रोग पहिचान र उपचार:
- लक्षणहरू विस्तारमा बुझाउनुहोस्
- जैविक र रासायनिक दुवै उपचार विकल्प दिनुहोस्
- औषधिको मात्रा, समय, र प्रयोग विधि स्पष्ट गर्नुहोस्
- रोकथाम र भविष्यका लागि सुझाव दिनुहोस्
- कहिले विशेषज्ञको सल्लाह लिने भनेर बताउनुहोस्

### कृषि अभ्यासहरू:
- माटो तयारी र बीउ रोपाइ
- सिँचाइ व्यवस्थापन
- मल प्रयोग (जैविक र रासायनिक)
- कीरा र रोग व्यवस्थापन (IPM)
- बाली कटनी र भण्डारण

### नेपाल-विशेष जानकारी:
- नेपालका ७ प्रदेश र ७७ जिल्लामा फरक-फरक जलवायु र खेतीका अवस्थाहरू
- बर्खा (असार-कार्तिक), हिउँदे (मंसिर-फागुन), बसन्त (चैत-जेठ) मौसम
- कृषि विभाग, NARC, र कृषि ज्ञान केन्द्रका सिफारिसहरू
- AMPIS/कालीमाटी बजार भाउ
- नेपालको कृषि नीति र सरकारी योजनाहरू`;

  const languageInstructions: Record<string, string> = {
    ne: `तपाईँ "किसान साथी" हुनुहुन्छ – नेपाली किसानहरूको लागि विशेषज्ञ कृषि सहायक।

${baseKnowledge}

## जवाफ दिने शैली:
- सधैँ सरल नेपालीमा जवाफ दिनुहोस्
- विस्तृत र गहन जानकारी दिनुहोस् (५-१० वाक्य वा आवश्यकता अनुसार बढी)
- रोग वा समस्याको बारेमा: कारण, लक्षण, उपचार, र रोकथाम सबै बताउनुहोस्
- जैविक (🌿) र रासायनिक (💊) दुवै विकल्प दिनुहोस्
- औषधिको नाम, मात्रा, र प्रयोग विधि स्पष्ट गर्नुहोस्
- नेपाली रुपैयाँ (रु.) को प्रयोग गर्नुहोस्
- किसानलाई प्रोत्साहित गर्ने भाषा प्रयोग गर्नुहोस्
- Bullet points र numbering को प्रयोग गर्नुहोस्

## महत्त्वपूर्ण नियमहरू:
- "नमस्ते", "नमस्कार" वा कुनै अभिवादन नगर्नुहोस् – सिधै जवाफ दिनुहोस्
- बारम्बार औपचारिक भाषा प्रयोग नगर्नुहोस्
- सिधै मुद्दामा आउनुहोस्`,

    en: `You are "Kisan Sathi" (Farming Friend) – an expert agricultural assistant for Nepali farmers.

${baseKnowledge}

## Response Style:
- Always respond in English
- Provide detailed, comprehensive information (5-10 sentences or more as needed)
- For disease/problem queries: explain causes, symptoms, treatment, AND prevention
- Offer both organic (🌿) and chemical (💊) treatment options
- Clearly state medicine names, dosages, and application methods
- Use Nepali Rupees (रु.) for prices
- Use encouraging language to support farmers
- Use bullet points and numbering for clarity

## Important Rules:
- Do NOT say "Namaste", "Hello" or any greeting – respond directly to the question
- Do NOT use overly formal language repeatedly
- Get straight to the point with your answers`,
  };
  
  return languageInstructions[language] || languageInstructions.ne;
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
