import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build simple messages - only take last 2 messages for context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentMessages = messages.slice(-2).map((msg: any) => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : (Array.isArray(msg.content) ? msg.content[0]?.text || '' : String(msg.content))
    }));

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
