import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 12 || month <= 2) return "Winter";
  if (month >= 3 && month <= 6) return "Summer";
  if (month >= 7 && month <= 9) return "Monsoon";
  return "Autumn";
}

const PREVENTION_PROMPT = `You are an agricultural plant protection expert for Nepali farmers.
Generate practical prevention and protection tips for the given crop against diseases and pests.

OUTPUT FORMAT (STRICT):
## 🛡️ रोकथाम उपायहरू (Prevention Tips)

### 1. बीउ र बिरुवा व्यवस्थापन (Seed & Seedling Management)
- 3-4 bullet points

### 2. खेत तयारी र सरसफाई (Field Preparation & Sanitation)
- 3-4 bullet points

### 3. मौसम अनुसार सावधानी (Seasonal Precautions)
- Current season-specific tips (3-4 bullets)

### 4. जैविक रोकथाम (Organic Prevention)
- Neem, trichoderma, bio-agents, companion planting, etc.
- 3-4 bullet points

### 5. रासायनिक रोकथाम (Chemical Prevention - only if needed)
- Preventive fungicides/insecticides with active ingredient names (NO brand names)
- Safe dosage, PHI days
- 2-3 bullet points

### 6. कीरा व्यवस्थापन (Pest Management)
- Common pests for this crop and prevention methods
- 3-4 bullet points

### 7. दैनिक निगरानी चेकलिस्ट (Daily Monitoring Checklist)
- 5-6 quick field checks

RULES:
- Use simple Nepali mixed with English technical terms
- Keep it practical and farmer-friendly
- Never recommend banned chemicals
- Only active ingredients, no brand names
- Relate to Nepali seasons and local conditions`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // POST = AI-generated prevention tips for a specific crop
  if (req.method === "POST") {
    try {
      const { crop_name, language = "ne" } = await req.json();

      if (!crop_name || !crop_name.trim()) {
        return new Response(
          JSON.stringify({ error: "crop_name is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "AI not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const season = getSeason(new Date());
      const userPrompt = language === "ne"
        ? `"${crop_name}" बालीको रोकथाम उपायहरू दिनुहोस्। अहिलेको मौसम: ${season}।`
        : `Give prevention tips for "${crop_name}" crop. Current season: ${season}.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: PREVENTION_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 3000,
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        console.error("[PREVENTION] AI error:", aiResponse.status);
        return new Response(
          JSON.stringify({ error: "AI service error" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiData = await aiResponse.json();
      const guide = aiData.choices?.[0]?.message?.content || null;

      return new Response(
        JSON.stringify({ guide, crop_name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("[PREVENTION] Error:", error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // GET = original DB-based tips
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    let crop = url.searchParams.get("crop");
    let season = url.searchParams.get("season");
    const farmerId = url.searchParams.get("farmer_id");

    if (!crop && farmerId) {
      const { data: latest } = await supabase
        .from("disease_detections")
        .select("detected_disease, analyzed_at")
        .eq("farmer_id", farmerId)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (latest) {
        const disease = latest.detected_disease || "";
        const knownCrops = ["Rice", "Tomato", "Wheat", "Potato", "Maize", "Cauliflower", "Cabbage", "Onion", "Chilli"];
        for (const c of knownCrops) {
          if (disease.toLowerCase().includes(c.toLowerCase())) {
            crop = c;
            break;
          }
        }
        if (!season) {
          season = getSeason(new Date(latest.analyzed_at));
        }
      }
    }

    if (!season) {
      season = getSeason(new Date());
    }

    let query = supabase.from("prevention_tips").select("*");
    if (crop) query = query.or(`crop.eq.${crop},crop.is.null`);
    if (season) query = query.or(`season.eq.${season},season.is.null`);

    const { data: tips, error } = await query.limit(10);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sorted = (tips || []).sort((a, b) => {
      if (a.crop && !b.crop) return -1;
      if (!a.crop && b.crop) return 1;
      return 0;
    }).slice(0, 5);

    return new Response(
      JSON.stringify({ crop: crop || null, season, tips: sorted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
