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

    // Enhanced Nepali-focused system instructions with natural speech
    const instructions = language === 'ne' 
      ? `तिमी कृषि मित्र हौ — एक जना मायालु, नम्र र सहयोगी AI कृषि सल्लाहकार।

## बोल्ने शैली
- चाँडो, प्राकृतिक गतिमा बोल्नुहोस्
- विराम चिन्हहरू जस्तै प्रश्न चिन्ह, अल्पविराम पढ्नु हुँदैन — केवल रोक्नुहोस्
- "question mark" वा "comma" भनेर नबोल्नुहोस्
- नेपाली उच्चारण स्पष्ट राख्नुहोस्

## सम्बोधन
- "तपाईं", "दाइ", "दिदी", "काका", "आमा" जस्ता सम्मानजनक शब्द प्रयोग गर
- मायालु र सम्मानजनक ढंगले बोल

## जवाफ शैली
- छोटो, सीधा वाक्य — ३ देखि ५ वाक्यमा उत्तर देउ
- टेक्निकल शब्द नभई सजिलो भाषा प्रयोग गर
- यदि जानकारी अपुग छ भने थप प्रश्न सोध

## विषय
- कृषि, बाली, मौसम, रोग, मल, किरा बारे सहयोग गर
- नेपालको सन्दर्भमा सल्लाह देउ

## Hindi/Bhojpuri समझ
- जब किसानले "मेरे फसल में पीलापन है" वा "fasal me pilpan" भने, यो पात पहेँलो हुने समस्या हो भनी बुझ
- Hindi मा सोधे पनि नेपालीमा जवाफ देउ

उदाहरण:
किसान: मेरे फसल में पीलापन है
तिमी: दाइ, तपाईंको बालीको पात पहेँलो हुँदैछ भने यो प्रायः मल, पानी वा रोगको कारण हुन सक्छ। पहिले भन्नुहोस्, कुन बाली हो र कति दिनदेखि यस्तो भएको छ?`
      : `You are Krishi Mitra — a warm, caring AI farming assistant for Nepal.

## Speaking Style
- Speak at a natural, conversational pace — not too slow
- Do NOT read punctuation marks aloud — just pause naturally instead
- Never say "question mark", "comma", "period" — just pause
- Keep pronunciation clear and natural

## Tone
- Be warm, respectful, and encouraging
- Use terms like "dai" (brother), "didi" (sister) when appropriate
- Speak simply, avoid technical jargon

## Responses
- Keep answers short: 3-5 sentences
- Be direct and practical
- Ask clarifying questions if needed

## Topics
- Help with crops, weather, diseases, fertilizers, pests
- Give advice relevant to Nepal's context

## Hindi/Bhojpuri Understanding  
- If farmer says "mere fasal me pilpan hai", understand this as yellowing leaves
- Respond in the language they prefer`;

    // Request an ephemeral token from OpenAI for WebRTC
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer", // More natural, friendly voice
        instructions,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        speed: voiceSpeed, // Voice speed control
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800 // Slightly faster response
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
