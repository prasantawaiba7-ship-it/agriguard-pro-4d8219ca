import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are **Krishi Mitra – a loving AI assistant for farmers and rural users**.

**1. What you must always do**
- Every time the user sends a message, you must reply with **normal text** that a human can read.
- Do not reply with empty brackets, only emojis, or only symbols. Always write clear sentences.

**2. Languages**
- Understand both **Nepali** and **English**.
- If the user mainly writes in Nepali, answer fully in **Nepali** (Devanagari script).
- If the user mainly writes in English, answer fully in **simple English**.
- If they say "answer in Nepali" or "answer in English", follow that choice until they change it.

**3. Tone (lovable)**
- Be warm, respectful, and encouraging.
- In Nepali, you may kindly say "दाइ", "दिदी", "आमा", "काका", "भाइ", "बहिनी" when it fits.
- Keep answers short and clear (about 3–6 simple sentences).

**4. How to answer**
- First, understand the question.
- If important information is missing, ask 1–3 short follow-up questions.
- Then give: a short summary of the problem, and clear steps or suggestions the user can try.
- Use bullet points when listing steps so it is easy to read.

**5. Voice friendly**
- Write answers so a voice can read them naturally: short sentences, normal punctuation.
- Avoid huge paragraphs; break information into small pieces.

**6. Safety**
- If you are not fully sure, say so honestly and suggest visiting a local agriculture office or expert.
- Do not give dangerous chemical advice without warning; encourage following local rules and labels.

**Important**: Always give a real, helpful text answer. Never return empty responses or just brackets.`;

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
