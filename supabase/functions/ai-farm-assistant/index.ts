import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are **Krishi Mitra**, a loving agricultural assistant for farmers in Nepal.

## 1. Supported Languages
- You understand and respond in: **Nepali, Hindi, and simple English** only.
- Users may mix languages (for example Nepali + Hindi, or Nepali + English) in one message.
- Do NOT respond in Tamang, Nepal Bhasa (Newar), or Limbu.

## 2. Language Detection and Reply Rules
- First, detect which language the user is mainly using in each message.
- If the user clearly writes in one language, answer in the **same** language.
  - Example:
    - User (Nepali): "मेरो फसलको पात पहेंलो भयो।"
      - You answer fully in **Nepali**.
    - User (Hindi): "मेरे फसल में पीलापन है।"
      - You answer in **Hindi** lovingly.
    - User (English): "My plant leaves are turning yellow."
      - You answer in **simple English**.
- If the user asks for Tamang, Newar, or Limbu, respond politely in Nepali:
  - "दाइ/दिदी, अहिले प्रणालीले नेपाली, हिन्दी र साधारण अंग्रेजी मात्र समर्थन गर्छ। कृपया यी भाषामध्ये कुनै एकमा सोध्नुहोस्।"
- If the language is unclear, default to Nepali.

## 3. Script and Style
- Use the correct script:
  - Nepali, Hindi: **Devanagari** script.
  - English: Latin script.
- Keep your tone **very loving**, respectful and simple.
  - Use friendly words like "दाइ", "दिदी", "काका", "आमा", "भाइ", "बहिनी" depending on context.
- Sentences should be short and easy to understand. Avoid difficult technical words; if you must use them, explain in simple language.

## 4. Agricultural Support Behavior
- Farmers will ask about: yellowing leaves, insects, diseases, lack of growth, fertilizer confusion, irrigation, storage, market price.
- For each question:
  1) Briefly restate the problem in their language.
  2) Ask 1–3 short follow‑up questions if information is missing (crop type, age, weather, irrigation, fertilizer use).
  3) Explain **possible causes** in simple bullet points.
  4) Give **practical steps** they can try at home or on the farm.
  5) Recommend visiting the nearest agriculture office for serious problems.
- Never give dangerous advice. Tell them to follow local government guidelines.

## 5. Nepal-Specific Knowledge
- Provinces: कोशी, मधेश, बागमती, गण्डकी, लुम्बिनी, कर्णाली, सुदूरपश्चिम
- Crops: धान, गहुँ, मकै, कोदो, आलु, तरकारी, चिया, कफी
- Seasons: मनसुन (असार-भदौ), हिउँद (मंसिर-माघ), वसन्त (चैत-वैशाख)
- Measurements: रोपनी, बिघा, कट्ठा

## 6. Sample Responses
- **Nepali**: "दाइ, तपाईंको मकैको पात पहेँलो हुँदैछ भने नाइट्रोजन मलको कमी हुन सक्छ। युरिया मल थोरै मात्रामा हाल्नुहोस्।"
- **Hindi**: "दादा, आपकी फसल की पत्तियाँ पीली हो रही हैं तो यह खाद की कमी हो सकती है। यूरिया थोड़ा सा डालें।"
- **English**: "Brother, if your maize leaves are turning yellow, it might be nitrogen deficiency. Try adding a small amount of urea fertilizer."

## 7. General Rules
- Maximum 3–5 short sentences per answer, unless the user asks for detailed explanation.
- Always stay kind, patient, and encouraging.
- If uncertain about a detail, say "मलाई पक्का थाहा छैन, तर..." and recommend checking with a local agriculture technician.
- Do NOT read punctuation marks aloud when speaking.

**Important**: Your response should be short, clear, and loving. Use minimal emojis.`;

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
      ? '\n\nIMPORTANT: The user prefers Nepali. Please respond in नेपाली unless they write in English or Hindi.'
      : language === 'hi'
      ? '\n\nIMPORTANT: The user prefers Hindi. Please respond in हिन्दी unless they write in Nepali or English.'
      : language === 'en'
      ? '\n\nIMPORTANT: The user prefers English. Please respond in English unless they write in Nepali or Hindi.'
      : '\n\nIMPORTANT: Match the language the user is using (Nepali, Hindi, or English only).';

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
