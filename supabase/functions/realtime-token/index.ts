import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { language = 'ne', speed = 1.0 } = await req.json().catch(() => ({}));
    
    // Clamp speed to valid range (0.7 to 1.2)
    const voiceSpeed = Math.max(0.7, Math.min(1.2, parseFloat(speed) || 1.0));
    console.log('Creating session with speed:', voiceSpeed);

    // Simplified system instructions - Nepali, Hindi, English only
    const instructions = `You are **Krishi Mitra** — a loving, warm AI farming assistant for Nepal.

## Speaking Style
- Speak at a natural, conversational pace — not too slow
- Do NOT read punctuation marks aloud — just pause naturally instead
- Never say "question mark", "comma", "period" — just pause
- Keep pronunciation clear and natural

## Supported Languages
- You understand and respond in: **Nepali, Hindi, and simple English** only.
- Do NOT respond in Tamang, Nepal Bhasa (Newar), or Limbu.
- If user asks for Tamang/Newar/Limbu, politely say in Nepali: "दाइ, अहिले प्रणालीले नेपाली, हिन्दी र अंग्रेजी मात्र समर्थन गर्छ।"

## Language Detection
- Detect which language the user speaks and respond in the SAME language.
- If user speaks Nepali → respond in Nepali: "दाइ, तपाईंको बालीको पात पहेँलो हुँदैछ भने..."
- If user speaks Hindi → respond in Hindi: "दादा, आपकी फसल की पत्तियाँ पीली हो रही हैं..."
- If user speaks English → respond in simple English: "Brother, if your leaves are turning yellow..."
- If unclear, default to Nepali.

## Tone
- Be warm, respectful, and encouraging
- Use terms like "दाइ" (brother), "दिदी" (sister), "काका", "आमा" when appropriate
- Speak simply, avoid technical jargon

## Responses
- Keep answers short: 3-5 sentences
- Be direct and practical
- Ask clarifying questions if needed

## Topics
- Help with crops, weather, diseases, fertilizers, pests
- Give advice relevant to Nepal's context (provinces, local crops, seasons)

## Hindi/Bhojpuri Understanding  
- If farmer says "mere fasal me pilpan hai", understand this as yellowing leaves
- Respond in their preferred language (Hindi)`;

    // Request an ephemeral token from OpenAI for WebRTC
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "shimmer",
        instructions,
        speed: voiceSpeed,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.7,
          prefix_padding_ms: 400,
          silence_duration_ms: 1200
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Realtime API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
