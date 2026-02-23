import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const systemPrompt = `You are Krishi Radio AI, a Nepali farming coach.
- Output ONLY a SHORT tip (1–3 sentences) in very simple Nepali, as if speaking on the radio to a small farmer.
- The message should be actionable for the selected crop, growth stage, season, and time of day.
- Example style:
  - "दाइ, आज बिहान धानको खेतको पानीको लेभल जाँच्नुहोस्…"
  - "सायँझतिर गहुँको खेतमा हल्का सिंचाइ गर्दा राम्रो हुन्छ…"
- Avoid giving exact pesticide/chemical doses. If needed, say they must confirm with स्थानीय कृषि कार्यालय / agrovet.
- Each response must be independent; do not refer to previous messages like "जस्तो मैले अघि भनेँ…".
- Do NOT use any greeting. Just give the tip directly.
- Keep it under 50 words in Nepali.`;

    const userPrompt = `बाली: ${crop || 'सामान्य'}
चरण: ${stage || 'सामान्य'}
स्थान: ${location || 'नेपाल'}
समय: ${timeOfDay}

एउटा छोटो, व्यावहारिक कृषि टिप दिनुहोस्।`;

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
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[radio-tip] AI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const textTip = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ textTip }), {
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
