import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fallbackSegments = [
  "दाइ, खेतमा पानी धेरै जमेको छैन भनेर आज बेलुका एकचोटि हेर्नुहोस्।",
  "गहुँको बालीमा जरासम्म पानी पुगेको छ कि छैन, हल्का खन्ती चलाएर जाँच्नुस्।",
  "रासायनिक मल प्रयोग गर्नुअघि लेबल राम्ररी पढ्नुहोस् र मात्रा बारे स्थानीय कृषि कार्यालयसँग सल्लाह लिनुहोस्।",
  "बिरुवा सार्दा जरा नबिग्रिने गरी सावधानी अपनाउनुहोस्।",
  "माटो परीक्षण गराएर बाली अनुसारको मल प्रयोग गर्नुहोस्।",
  "सिँचाइ गर्दा बिहान वा बेलुकाको समय छान्नुहोस्।",
  "रोग वा कीरा लागेको शंका लागेमा तुरुन्तै कृषि प्राविधिकलाई सम्पर्क गर्नुहोस्।",
  "बाली लगाउनुअघि खेतको माटो राम्ररी जोत्नुहोस्।",
];

function getTimeOfDay(): string {
  const hour = new Date().getUTCHours() + 5.75; // Nepal UTC+5:45
  const nplHour = hour >= 24 ? hour - 24 : hour;
  if (nplHour < 10) return 'बिहान (morning)';
  if (nplHour < 14) return 'दिउँसो (afternoon)';
  if (nplHour < 18) return 'साँझ (evening)';
  return 'बेलुका (night)';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop, stage, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const timeOfDay = getTimeOfDay();

    const systemPrompt = `You are Krishi Radio AI, a friendly Nepali farming radio host.
You speak naturally to small farmers as if on a live radio program.

RULES:
- Output a JSON array of 5–8 short segments. Each segment is 1–2 sentences in very simple Nepali.
- Each segment should be an independent, practical farming tip or advice for the given crop, growth stage, season, and time of day.
- Do NOT number them ("पहिलो टिप", "दोस्रो टिप" etc.). Speak naturally, as if it's a small radio program flowing from one topic to the next.
- Use transitions like "अब अर्को कुरा…", "त्यसै गरी…", "एउटा सल्लाह दिन्छु…" to connect segments.
- Total speaking time of all segments combined: roughly 2–3 minutes.
- Avoid giving exact pesticide/chemical doses. Say they must confirm with स्थानीय कृषि कार्यालय / agrovet.
- Do NOT use any greeting in the first segment. Just start with a tip.
- Keep each segment under 40 words in Nepali.

OUTPUT FORMAT (strict JSON, no markdown):
[
  {"text": "segment text here", "pauseMs": 2000},
  {"text": "next segment", "pauseMs": 1500}
]

pauseMs should be between 1500 and 3000, varying naturally.`;

    const userPrompt = `बाली: ${crop || 'सामान्य'}
चरण: ${stage || 'सामान्य'}
स्थान: ${location || 'नेपाल'}
समय: ${timeOfDay}

कृपया 5–8 वटा छोटा radio segments JSON array मा दिनुहोस्।`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[radio-tip] AI error:", response.status, errorText);

      // Fallback for 402 (credits exhausted)
      if (response.status === 402) {
        const shuffled = [...fallbackSegments].sort(() => Math.random() - 0.5).slice(0, 6);
        const segments = shuffled.map(text => ({ text, pauseMs: 2000 }));
        return new Response(JSON.stringify({ segments, fromAI: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '[]';
    
    // Parse AI response - handle possible markdown code block wrapping
    let segments: Array<{text: string; pauseMs: number}>;
    try {
      const cleaned = rawContent.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
      segments = JSON.parse(cleaned);
      if (!Array.isArray(segments) || segments.length === 0) throw new Error("not array");
      // Validate each segment
      segments = segments.filter(s => s && typeof s.text === 'string' && s.text.trim())
        .map(s => ({ text: s.text.trim(), pauseMs: Math.max(1500, Math.min(3000, s.pauseMs || 2000)) }));
    } catch {
      // If parsing fails, treat raw content as a single tip (backward compat)
      segments = [{ text: rawContent, pauseMs: 2000 }];
    }

    return new Response(JSON.stringify({ segments, fromAI: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[radio-tip] Error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
