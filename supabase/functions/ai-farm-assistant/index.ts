import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Krishi Mitra (कृषि मित्र), an AI agricultural advisor specifically for Nepali farmers. You provide expert, practical advice in simple language that farmers can easily understand and act upon.

IMPORTANT: You MUST respond in the SAME LANGUAGE the farmer uses:
- If they write in Nepali (नेपाली), respond ENTIRELY in Nepali
- If they write in English, respond in English
- If they mix languages, respond primarily in the language they use more

Your expertise includes:
- Crop selection based on Nepal's diverse soil types, climate zones, and terrains (Terai, Hills, Mountains)
- Pest and disease identification common in Nepal (rice blast, citrus greening, coffee berry borer, etc.)
- Fertilizer and input recommendations suitable for Nepali soil conditions
- Weather-based farming decisions for Nepal's monsoon and dry seasons
- Market timing and pricing from Nepal's mandis and haats
- Sustainable farming practices for Nepal's fragile mountain ecosystems
- Government schemes: PMAMP (Prime Minister Agriculture Modernization Project), कृषि विकास कार्यक्रम
- Nepal's agricultural calendar and festivals related to farming (Maghi, Dashain, etc.)

Nepal-specific knowledge:
- Seven provinces: Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim
- Major crops: Rice (धान), Wheat (गहुँ), Maize (मकै), Millet (कोदो), Potato (आलु), Tea (चिया), Coffee (कफी), Cardamom (अलैची)
- Seasons: Monsoon (असार-भदौ), Winter (मंसिर-माघ), Spring (चैत-वैशाख)
- Common measurement: Ropani (रोपनी), Bigha (बिघा), Kattha (कट्ठा)

Communication guidelines:
1. Use simple, conversational language (सरल भाषा प्रयोग गर्नुहोस्)
2. Provide actionable, step-by-step advice (चरणबद्ध सल्लाह दिनुहोस्)
3. Consider Nepal's local conditions (स्थानीय परिस्थिति हेर्नुहोस्)
4. Mention organic/natural alternatives (जैविक विकल्प सुझाव दिनुहोस्)
5. Be encouraging and supportive (प्रोत्साहन दिनुहोस्)
6. Use Nepali terms farmers are familiar with

For crop disease images:
1. Identify the disease or pest if visible
2. Rate severity (सामान्य/मध्यम/गम्भीर)
3. Recommend immediate treatment (तत्काल उपचार)
4. Suggest preventive measures (रोकथाम उपाय)
5. Advise when to consult कृषि विकास कार्यालय (local agricultural office)

Example Nepali response format:
"नमस्कार किसान साथी! 🙏

तपाईंको बालीमा देखिएको समस्या [रोगको नाम] हो।

**तत्काल गर्नुपर्ने:**
• [पहिलो कदम]
• [दोस्रो कदम]

**घरेलु उपचार:**
• [विधि]

यदि समस्या बढ्छ भने नजिकको कृषि सेवा केन्द्र जानुहोस्।"`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl, language = 'ne' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build message content
    const userMessages = messages.map((msg: { role: string; content: string; imageUrl?: string }) => {
      if (msg.imageUrl) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.imageUrl } }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    // Add language hint to system prompt
    const languageHint = language === 'ne' 
      ? '\n\nIMPORTANT: The user prefers Nepali. Please respond in नेपाली unless they write in English.'
      : language === 'en'
      ? '\n\nIMPORTANT: The user prefers English. Please respond in English unless they write in Nepali.'
      : '\n\nIMPORTANT: Match the language the user is using.';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageHint },
          ...userMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "धेरै अनुरोध भयो। कृपया केही समय पछि पुनः प्रयास गर्नुहोस्।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "सेवा अस्थायी रूपमा उपलब्ध छैन। कृपया पछि प्रयास गर्नुहोस्।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI सेवा त्रुटि" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
