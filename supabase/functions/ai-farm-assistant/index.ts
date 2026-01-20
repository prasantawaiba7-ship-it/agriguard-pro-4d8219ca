import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract disease/pest keywords from user message
function extractDiseaseKeywords(message: string): string[] {
  const keywords: string[] = [];
  
  // Common disease/pest patterns in English and Nepali
  const diseasePatterns = [
    // English patterns
    /blast|blight|rust|wilt|rot|mildew|virus|curl|spot|smut|borer|armyworm|aphid|mite|moth|hopper|caterpillar/gi,
    // Nepali patterns
    /झुल्सा|रोग|कीरा|माहुरी|लाही|काट|ढुसी|सुक्ने|कुहिने|पहेँलो|खैरो|सेतो/gi,
    // Crop-disease combinations
    /rice blast|late blight|early blight|leaf curl|yellow rust|brown rust|fall armyworm|stem borer|powdery mildew|downy mildew|bacterial wilt|fusarium wilt/gi
  ];

  for (const pattern of diseasePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }
  }

  // Also extract crop names for better matching
  const cropPatterns = /rice|wheat|maize|corn|potato|tomato|vegetables|आलु|धान|गहुँ|मकै|गोलभेडा|तरकारी/gi;
  const cropMatches = message.match(cropPatterns);
  if (cropMatches) {
    keywords.push(...cropMatches.map(m => m.toLowerCase()));
  }

  return [...new Set(keywords)]; // Remove duplicates
}

// Fetch relevant treatments from database
async function fetchRelevantTreatments(keywords: string[], supabaseUrl: string, supabaseKey: string) {
  if (keywords.length === 0) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Build search query
    let query = supabase
      .from('crop_treatments')
      .select('id, crop_name, disease_or_pest_name, disease_or_pest_name_ne, treatment_title, treatment_title_ne, youtube_video_url, severity_level')
      .eq('is_active', true);

    // Search for matching treatments
    const searchTerms = keywords.join(' ');
    const { data, error } = await query
      .or(`disease_or_pest_name.ilike.%${keywords[0]}%,crop_name.ilike.%${keywords[0]}%,treatment_title.ilike.%${keywords[0]}%`)
      .limit(5);

    if (error) {
      console.error('[AI] Error fetching treatments:', error);
      return [];
    }

    // Further filter by relevance score
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

    // Sort by relevance and return top 3
    return scoredResults
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch (error) {
    console.error('[AI] Treatment fetch error:', error);
    return [];
  }
}

// Language-specific system prompts for Nepal farming context
const getSystemPrompt = (language: string): string => {
  const baseKnowledge = `
## तपाईंको ज्ञान र क्षमताहरू:

### बाली रोगहरू (Crop Diseases):
- **धान (Rice)**: Blast (तोपे रोग), Sheath Blight (खोल झुल्सा), Brown Spot (खैरो थोप्ला), Bacterial Leaf Blight (जिवाणु पात झुल्सा)
- **गहुँ (Wheat)**: Yellow Rust (पहेँलो काट), Brown Rust (खैरो काट), Loose Smut (धूलो रोग), Powdery Mildew (सेतो धूली)
- **मकै (Maize)**: Stem Borer (डाँठ खोर्ने कीरा), Fall Armyworm (फौजी किरा), Turcicum Leaf Blight (पातझुल्सा), Downy Mildew
- **आलु (Potato)**: Late Blight (पछिल्लो झुल्सा), Early Blight (अगौटे झुल्सा), Black Scurf, Viral Diseases
- **गोलभेडा (Tomato)**: Leaf Curl Virus (पात कुम्मिने रोग), Bacterial Wilt (ओइलाउने रोग), Fusarium Wilt, Blossom End Rot
- **तरकारी (Vegetables)**: Diamond Back Moth, Aphids (लाही), Red Spider Mite, Powdery Mildew, Anthracnose

### रोग पहिचान र उपचार (Disease Identification & Treatment):
- लक्षणहरू विस्तृत रूपमा व्याख्या गर्नुहोस्
- जैविक र रासायनिक दुवै उपचार विकल्पहरू दिनुहोस्
- औषधिको मात्रा, समय, र प्रयोग विधि स्पष्ट गर्नुहोस्
- रोकथाम र भविष्यको लागि सुझाव दिनुहोस्
- कहिले विशेषज्ञको सल्लाह लिने भन्ने बताउनुहोस्

### कृषि अभ्यासहरू (Agricultural Practices):
- माटो तयारी र बीउ रोपण
- सिंचाई व्यवस्थापन
- मल प्रयोग (जैविक र रासायनिक)
- कीट र रोग व्यवस्थापन (IPM)
- बाली कटनी र भण्डारण

### नेपाल-विशेष जानकारी:
- नेपालका ७ प्रदेशहरूमा फरक जलवायु र खेती अवस्था
- मनसुन मौसम (असार-भाद्र) र हिउँदे खेती
- स्थानीय बजार मूल्य र उपलब्ध कृषि सामग्रीहरू
- सरकारी कृषि सेवाहरू र सम्पर्क`;

  const languageInstructions: Record<string, string> = {
    ne: `तपाईं "कृषि मित्र" (Krishi Mitra) हुनुहुन्छ - नेपाली किसानहरूको लागि विशेषज्ञ कृषि सहायक।

${baseKnowledge}

## जवाफ दिने शैली:
- सधैं नेपाली भाषामा जवाफ दिनुहोस्
- विस्तृत र गहन जानकारी दिनुहोस् (५-१० वाक्य वा आवश्यकता अनुसार थप)
- रोग वा समस्याको बारेमा सोध्दा: कारण, लक्षण, उपचार, र रोकथाम सबै बताउनुहोस्
- जैविक (🌿) र रासायनिक (💊) दुवै विकल्प दिनुहोस्
- औषधिको नाम, मात्रा, र प्रयोग विधि स्पष्ट पार्नुहोस्
- नेपाली रुपैयाँ (रु.) प्रयोग गर्नुहोस्
- किसानलाई प्रोत्साहित गर्ने भाषा प्रयोग गर्नुहोस्
- Bullet points र numbering प्रयोग गरी स्पष्ट बनाउनुहोस्`,
    
    hi: `आप "कृषि मित्र" (Krishi Mitra) हैं - नेपाली किसानों के लिए विशेषज्ञ कृषि सहायक।

${baseKnowledge}

## जवाब देने की शैली:
- हमेशा हिंदी में जवाब दें
- विस्तृत और गहन जानकारी दें (५-१० वाक्य या आवश्यकतानुसार अधिक)
- रोग या समस्या के बारे में: कारण, लक्षण, उपचार, और रोकथाम सभी बताएं
- जैविक (🌿) और रासायनिक (💊) दोनों विकल्प दें
- दवाई का नाम, मात्रा, और उपयोग विधि स्पष्ट करें
- नेपाली रुपये (रु.) का उपयोग करें
- किसान को प्रोत्साहित करने वाली भाषा का उपयोग करें`,
    
    tamang: `तपाईं "कृषि मित्र" हुनुहुन्छ - तामाङ किसानहरूको लागि विशेषज्ञ कृषि सहायक।
${baseKnowledge}
तामाङ वा नेपाली भाषामा विस्तृत जवाफ दिनुहोस्।`,
    
    newar: `तपाईं "कृषि मित्र" हुनुहुन्छ - नेवार किसानहरूको लागि विशेषज्ञ कृषि सहायक।
${baseKnowledge}
नेवारी वा नेपाली भाषामा विस्तृत जवाफ दिनुहोस्।`,
    
    maithili: `तपाईं "कृषि मित्र" हुनुहुन्छ - मैथिली किसानहरूको लागि विशेषज्ञ कृषि सहायक।
${baseKnowledge}
मैथिली वा नेपाली भाषामा विस्तृत जवाफ दिनुहोस्।`,
    
    magar: `तपाईं "कृषि मित्र" हुनुहुन्छ - मगर किसानहरूको लागि विशेषज्ञ कृषि सहायक।
${baseKnowledge}
मगर वा नेपाली भाषामा विस्तृत जवाफ दिनुहोस्।`,
    
    rai: `तपाईं "कृषि मित्र" हुनुहुन्छ - राई किसानहरूको लागि विशेषज्ञ कृषि सहायक।
${baseKnowledge}
राई वा नेपाली भाषामा विस्तृत जवाफ दिनुहोस्।`,
    
    en: `You are "Krishi Mitra" (Farming Friend) - an expert agricultural assistant for Nepali farmers.

${baseKnowledge}

## Response Style:
- Always respond in English
- Provide detailed, comprehensive information (5-10 sentences or more as needed)
- For disease/problem queries: explain causes, symptoms, treatment, AND prevention
- Offer both organic (🌿) and chemical (💊) treatment options
- Clearly state medicine names, dosages, and application methods
- Use Nepali Rupees (Rs.) for prices
- Use encouraging language to support farmers
- Use bullet points and numbering for clarity`,
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

    // Build simple messages - only take last 2 messages for context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentMessages = messages.slice(-2).map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content[0]?.text || '' : String(msg.content))
    }));

    // Extract the latest user message for keyword extraction
    const latestUserMessage = recentMessages.find((m: any) => m.role === 'user')?.content || '';
    
    // Extract disease/pest keywords and fetch relevant treatments
    const keywords = extractDiseaseKeywords(latestUserMessage);
    let treatments: any[] = [];
    
    if (keywords.length > 0 && SUPABASE_URL && SUPABASE_ANON_KEY) {
      console.log(`[AI] Extracted keywords: ${keywords.join(', ')}`);
      treatments = await fetchRelevantTreatments(keywords, SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log(`[AI] Found ${treatments.length} relevant treatments`);
    }

    // Get language-specific system prompt
    const systemPrompt = getSystemPrompt(language);

    console.log(`[AI] Starting request, lang=${language}, msgs=${recentMessages.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Better model for detailed responses
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
        stream: true,
        max_tokens: 1500, // Allow much longer responses for detailed disease info
        temperature: 0.4, // Slightly creative for helpful responses
      }),
    });

    console.log(`[AI] Response received in ${Date.now() - startTime}ms, status=${response.status}`);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "धेरै अनुरोध। केही समय पछि प्रयास गर्नुहोस्।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[AI] Error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "त्रुटि" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have treatments, we need to append them after the streaming response
    // We'll do this by transforming the stream
    if (treatments.length > 0) {
      const originalStream = response.body;
      
      const transformedStream = new TransformStream({
        async start(controller) {
          // Process original stream
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
          
          // Append treatments data as a custom SSE event
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
    return new Response(JSON.stringify({ error: "त्रुटि" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
