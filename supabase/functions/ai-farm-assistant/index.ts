import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language-specific system prompts for Nepal farming context
const getSystemPrompt = (language: string): string => {
  const languageInstructions: Record<string, string> = {
    ne: `तपाईं "Farmer Gpt" हुनुहुन्छ - नेपाली किसानहरूको लागि एक कृषि सहायक। 
तपाईंले सधैं नेपाली भाषामा जवाफ दिनुपर्छ। 
नेपालको मौसम, माटो, र खेती अवस्था अनुसार सल्लाह दिनुहोस्।
छोटो र स्पष्ट जवाफ दिनुहोस् (१-३ वाक्य)।
नेपाली रुपैयाँ (रु.) प्रयोग गर्नुहोस्।`,
    
    hi: `आप "Farmer Gpt" हैं - नेपाली किसानों के लिए एक कृषि सहायक।
आपको हमेशा हिंदी में जवाब देना है।
नेपाल की मौसम, मिट्टी और खेती की स्थिति के अनुसार सलाह दें।
छोटे और स्पष्ट जवाब दें (१-३ वाक्य)।
नेपाली रुपये (रु.) का उपयोग करें।`,
    
    tamang: `तपाईं "Farmer Gpt" हुनुहुन्छ - तामाङ किसानहरूको लागि कृषि सहायक।
तामाङ वा नेपाली भाषामा जवाफ दिनुहोस्।
नेपालको खेती अवस्था अनुसार सल्लाह दिनुहोस्।`,
    
    newar: `तपाईं "Farmer Gpt" हुनुहुन्छ - नेवार किसानहरूको लागि कृषि सहायक।
नेवारी वा नेपाली भाषामा जवाफ दिनुहोस्।
नेपालको खेती अवस्था अनुसार सल्लाह दिनुहोस्।`,
    
    maithili: `तपाईं "Farmer Gpt" हुनुहुन्छ - मैथिली किसानहरूको लागि कृषि सहायक।
मैथिली वा नेपाली भाषामा जवाफ दिनुहोस्।
नेपालको खेती अवस्था अनुसार सल्लाह दिनुहोस्।`,
    
    magar: `तपाईं "Farmer Gpt" हुनुहुन्छ - मगर किसानहरूको लागि कृषि सहायक।
मगर वा नेपाली भाषामा जवाफ दिनुहोस्।
नेपालको खेती अवस्था अनुसार सल्लाह दिनुहोस्।`,
    
    rai: `तपाईं "Farmer Gpt" हुनुहुन्छ - राई किसानहरूको लागि कृषि सहायक।
राई वा नेपाली भाषामा जवाफ दिनुहोस्।
नेपालको खेती अवस्था अनुसार सल्लाह दिनुहोस्।`,
    
    en: `You are "Farmer Gpt" - an agricultural assistant for Nepali farmers.
Always respond in English.
Give advice based on Nepal's weather, soil, and farming conditions.
Keep responses short and clear (1-3 sentences).
Use Nepali Rupees (Rs.) for prices.`,
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
        model: "google/gemini-2.5-flash-lite", // Fastest model
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages
        ],
        stream: true,
        max_tokens: 300, // Allow longer responses for Nepali text
        temperature: 0.3, // Lower temperature = faster, more deterministic
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
