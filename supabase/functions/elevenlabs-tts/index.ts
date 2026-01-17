import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Voice selection based on language
    // For Nepali/Hindi: Use Lily (warm multilingual female voice that handles Devanagari well)
    // For English: Use Sarah (natural female voice)
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      if (language === 'ne' || language === 'hi') {
        // Lily - works well with Nepali/Hindi (multilingual)
        selectedVoiceId = "pFZP5JQG7iQjIQuC4Bku";
      } else {
        // Sarah - warm English voice
        selectedVoiceId = "EXAVITQu4vr4xnSDxMaL";
      }
    }

    console.log(`Generating TTS for text length: ${text.length}, voice: ${selectedVoiceId}, language: ${language || 'auto'}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // Supports 29 languages including Nepali
          voice_settings: {
            stability: 0.6, // Slightly higher for clearer Nepali pronunciation
            similarity_boost: 0.75,
            style: 0.2, // Lower for more natural speech
            use_speaker_boost: true,
            speed: 0.95, // Slightly slower for clearer Nepali
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);

      // IMPORTANT: Return 200 so the frontend can gracefully fall back to browser TTS
      // without the request being treated as a hard failure.
      return new Response(
        JSON.stringify({
          ok: false,
          status: response.status,
          error: `ElevenLabs API error: ${response.status}`,
          detail: errorText,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error: unknown) {
    console.error("TTS error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
