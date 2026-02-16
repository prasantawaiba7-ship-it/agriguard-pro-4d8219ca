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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    let crop = url.searchParams.get("crop");
    let season = url.searchParams.get("season");
    const farmerId = url.searchParams.get("farmer_id");

    // If crop/season not provided, derive from latest detection
    if (!crop && farmerId) {
      const { data: latest } = await supabase
        .from("disease_detections")
        .select("detected_disease, analyzed_at")
        .eq("farmer_id", farmerId)
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .single();

      if (latest) {
        // Try to extract crop from detected_disease string
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

    // Query with crop + season
    let query = supabase.from("prevention_tips").select("*");

    if (crop) {
      // Get crop-specific OR generic tips
      query = query.or(`crop.eq.${crop},crop.is.null`);
    }

    if (season) {
      query = query.or(`season.eq.${season},season.is.null`);
    }

    const { data: tips, error } = await query.limit(10);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sort: crop-specific first, then generic
    const sorted = (tips || []).sort((a, b) => {
      if (a.crop && !b.crop) return -1;
      if (!a.crop && b.crop) return 1;
      return 0;
    }).slice(0, 5);

    return new Response(
      JSON.stringify({
        crop: crop || null,
        season,
        tips: sorted,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
