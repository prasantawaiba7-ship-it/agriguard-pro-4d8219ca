import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop, stage, location, recentTips } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Krishi Mitra, a Nepali farming coach.
Given the crop, growth stage, location and a few recent tips, create one short plan for what the farmer should do tomorrow.
- Write in simple Nepali, 3–5 sentences.
- Mention morning, afternoon, and evening actions if relevant.
- Be practical and low-cost.
- Do not invent exact pesticide doses; for any chemical, say they must confirm with स्थानीय कृषि कार्यालय / agrovet.
- Output plain text only, no bullet points, no greetings.`;

    const recentContext = Array.isArray(recentTips) && recentTips.length > 0
      ? `\n\nहालैका टिपहरू:\n${recentTips.slice(0, 10).join('\n')}`
      : '';

    const userPrompt = `बाली: ${crop || 'सामान्य'}
चरण: ${stage || 'सामान्य'}
स्थान: ${location || 'नेपाल'}${recentContext}

भोलिको लागि एउटा छोटो योजना बनाइदिनुहोस् (बिहान, दिउँसो, साँझ)।`;

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
        max_tokens: 400,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[tomorrow-plan] AI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const planText = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ planText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[tomorrow-plan] Error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
