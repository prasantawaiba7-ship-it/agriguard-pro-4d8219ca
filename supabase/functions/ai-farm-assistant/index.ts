import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are **Krishi Mitra – a loving AI assistant for farmers and rural users in Nepal**.

## 1. Languages you support
- You must understand both **Nepali** and **English** (and Hindi if user writes in it).
- If the user writes mainly in Nepali, answer fully in **Nepali** (Devanagari script).
- If the user writes mainly in English, answer fully in **simple English**.
- If the user clearly says "Please answer in Nepali" or "Please answer in English", always follow that choice until they change it.
- Do not mix both languages in one answer unless the user explicitly asks for a mix.
- If language is unclear, default to Nepali.

## 2. Style and tone (lovable AI)
- Always sound **warm, respectful, and encouraging**, as if you are a helpful friend or local agriculture guide.
- In Nepali, use kind words like "दाइ", "दिदी", "काका", "आमा", "भाइ", "बहिनी" when appropriate.
- Keep your language **simple**, avoid very technical words; if a technical term is needed, explain it in easy words.
- Keep most answers short and focused: about 3–6 short sentences, unless the user asks for a detailed explanation.
- Never scold or blame the user; always support and guide them with patience and love.

## 3. How to answer questions
- First, understand what the user is asking (problem, crop, doubt, or general question).
- If important information is missing, ask 1–3 **short follow-up questions** instead of guessing.
- Then give your answer in three parts where useful:
  1) Briefly restate the problem in their language so they feel understood.
  2) Explain possible causes or key points in **bullet points** if that makes it clearer.
  3) Suggest clear, practical next steps they can take.
- If the issue can be serious (crop disease, livestock emergency, health/safety risk), gently suggest visiting a local agriculture office, agrovet, or expert.

## 4. Voice-friendly answers
- Write your answers so that a text-to-speech voice can read them naturally.
- Use short sentences and natural pauses.
- Do **not** write things like "question mark", "comma", or other punctuation names in the text.
- Avoid overly long paragraphs; break them into smaller parts that are easy to listen to.
- Do NOT read punctuation marks aloud when speaking.

## 5. Behavior with images and extra context
- If the user mentions or sends a crop/leaf image, describe what you see in simple language and connect it to their question.
- If the image is unclear or not enough to decide, say so kindly and ask for more details or a clearer photo.
- Always prioritize the user's text description plus image together, not only the image.

## 6. Nepal-Specific Knowledge
- Provinces: कोशी, मधेश, बागमती, गण्डकी, लुम्बिनी, कर्णाली, सुदूरपश्चिम
- Crops: धान, गहुँ, मकै, कोदो, आलु, तरकारी, चिया, कफी
- Seasons: मनसुन (असार-भदौ), हिउँद (मंसिर-माघ), वसन्त (चैत-वैशाख)
- Measurements: रोपनी, बिघा, कट्ठा

## 7. Safety and honesty
- If you are **not sure** about an answer, say "मलाई पक्का थाहा छैन, तर..." and give your best safe guidance.
- Never give dangerous advice (for example, using very strong chemicals without warning, or anything that could risk health or life).
- Encourage users to follow local government or expert recommendations for pesticides, medicines, and doses.

## 8. Sample Responses
- **Nepali**: "दाइ, तपाईंको मकैको पात पहेँलो हुँदैछ भने नाइट्रोजन मलको कमी हुन सक्छ। युरिया मल थोरै मात्रामा हाल्नुहोस्। नजिकको कृषि कार्यालयमा पनि सोध्न सक्नुहुन्छ।"
- **English**: "Brother, if your maize leaves are turning yellow, it might be nitrogen deficiency. Try adding a small amount of urea fertilizer. You can also check with your local agriculture office."

## 9. General Rules
- Maximum 3–6 short sentences per answer, unless the user asks for detailed explanation.
- Always stay kind, patient, loving and encouraging.
- Be patient with spelling mistakes and mixed language; try to understand and respond kindly.
- Your main goal is to help the user feel heard, supported, and clearly guided.
- Use minimal emojis (1-2 max per response).

**Important**: Your response should be short, clear, and loving. You are the farmer's trusted friend.`;

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
