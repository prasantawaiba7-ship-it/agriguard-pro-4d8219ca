import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoilTestData {
  ph: number | null;
  nitrogen_level: number | null;
  phosphorus_level: number | null;
  potassium_level: number | null;
  organic_matter_percent: number | null;
}

interface NPKRecommendation {
  nitrogen_kg_per_ropani: number;
  phosphorus_kg_per_ropani: number;
  potassium_kg_per_ropani: number;
  urea_kg: number;
  dap_kg: number;
  mop_kg: number;
  advice_ne: string;
  advice_en: string;
  ph_status: string;
  organic_matter_status: string;
}

// NPK requirements by crop (kg per ropani = 508.74 sq meters)
const cropNPKRequirements: Record<string, { n: number; p: number; k: number }> = {
  "धान": { n: 4, p: 2, k: 2 },
  "rice": { n: 4, p: 2, k: 2 },
  "मकै": { n: 5, p: 2.5, k: 2 },
  "maize": { n: 5, p: 2.5, k: 2 },
  "गहुँ": { n: 4.5, p: 2.5, k: 2 },
  "wheat": { n: 4.5, p: 2.5, k: 2 },
  "आलु": { n: 5, p: 3, k: 4 },
  "potato": { n: 5, p: 3, k: 4 },
  "गोलभेंडा": { n: 4, p: 2.5, k: 3 },
  "tomato": { n: 4, p: 2.5, k: 3 },
  "काउली": { n: 4.5, p: 2.5, k: 2.5 },
  "cauliflower": { n: 4.5, p: 2.5, k: 2.5 },
  "default": { n: 4, p: 2, k: 2 },
};

function calculateNPKRecommendation(
  soilData: SoilTestData,
  cropName: string,
  areaRopani: number
): NPKRecommendation {
  const crop = cropNPKRequirements[cropName.toLowerCase()] || cropNPKRequirements["default"];
  
  // Soil nutrient levels (kg/ha typical ranges)
  // Low: N<280, P<10, K<120
  // Medium: N 280-560, P 10-25, K 120-280
  // High: N>560, P>25, K>280
  
  const nLevel = soilData.nitrogen_level || 300; // default medium
  const pLevel = soilData.phosphorus_level || 15;
  const kLevel = soilData.potassium_level || 150;
  const ph = soilData.ph || 6.5;
  const om = soilData.organic_matter_percent || 2;
  
  // Calculate deficiency multipliers
  const nMultiplier = nLevel < 280 ? 1.3 : nLevel > 560 ? 0.7 : 1.0;
  const pMultiplier = pLevel < 10 ? 1.3 : pLevel > 25 ? 0.7 : 1.0;
  const kMultiplier = kLevel < 120 ? 1.3 : kLevel > 280 ? 0.7 : 1.0;
  
  // Calculate per ropani requirements
  const nReq = Math.round(crop.n * nMultiplier * 10) / 10;
  const pReq = Math.round(crop.p * pMultiplier * 10) / 10;
  const kReq = Math.round(crop.k * kMultiplier * 10) / 10;
  
  // Convert to fertilizer amounts (Urea=46% N, DAP=18% N + 46% P2O5, MOP=60% K2O)
  const urea = Math.round((nReq / 0.46) * areaRopani * 10) / 10;
  const dap = Math.round((pReq / 0.46) * areaRopani * 10) / 10;
  const mop = Math.round((kReq / 0.60) * areaRopani * 10) / 10;
  
  // pH status
  let phStatus = "सामान्य (Normal)";
  let phAdvice = "";
  if (ph < 5.5) {
    phStatus = "अत्यधिक अम्लीय (Very Acidic)";
    phAdvice = "चुन (lime) प्रयोग गर्नुहोस्। ";
  } else if (ph < 6.0) {
    phStatus = "अम्लीय (Acidic)";
    phAdvice = "चुन हाल्न सिफारिस। ";
  } else if (ph > 8.0) {
    phStatus = "क्षारीय (Alkaline)";
    phAdvice = "जिप्सम वा गोबर मल प्रयोग गर्नुहोस्। ";
  } else if (ph > 7.5) {
    phStatus = "हल्का क्षारीय (Slightly Alkaline)";
  }
  
  // Organic matter status
  let omStatus = "मध्यम (Medium)";
  let omAdvice = "";
  if (om < 1.5) {
    omStatus = "कम (Low)";
    omAdvice = "गोबर मल वा कम्पोस्ट थप्नुहोस्। ";
  } else if (om > 3) {
    omStatus = "राम्रो (Good)";
  }
  
  const adviceNe = `${phAdvice}${omAdvice}${cropName} बालीको लागि प्रति रोपनी: युरिया ${urea} kg, डीएपी ${dap} kg, एमओपी ${mop} kg प्रयोग गर्नुहोस्। बीउ रोप्दा आधा युरिया र पूरा डीएपी/एमओपी, बाँकी युरिया बाली बढ्दै गर्दा हाल्नुहोस्।`;
  
  const adviceEn = `${ph < 6 ? "Apply lime to correct soil acidity. " : ""}${om < 1.5 ? "Add compost or FYM to improve organic matter. " : ""}For ${cropName} per ropani: Urea ${urea}kg, DAP ${dap}kg, MOP ${mop}kg. Apply half urea + full DAP/MOP at sowing, remaining urea as top dressing.`;
  
  return {
    nitrogen_kg_per_ropani: nReq,
    phosphorus_kg_per_ropani: pReq,
    potassium_kg_per_ropani: kReq,
    urea_kg: urea,
    dap_kg: dap,
    mop_kg: mop,
    advice_ne: adviceNe,
    advice_en: adviceEn,
    ph_status: phStatus,
    organic_matter_status: omStatus,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { field_id, crop_name, area_ropani } = await req.json();

    if (!field_id) {
      return new Response(
        JSON.stringify({ error: "field_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[SOIL-ADVISORY] Fetching soil data for field: ${field_id}`);

    // Get latest soil test for this field
    const { data: soilTest, error: soilError } = await supabaseClient
      .from("soil_tests")
      .select("*")
      .eq("field_id", field_id)
      .order("sample_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (soilError) {
      console.error("[SOIL-ADVISORY] Error fetching soil test:", soilError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch soil test data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const soilData: SoilTestData = soilTest || {
      ph: 6.5,
      nitrogen_level: 300,
      phosphorus_level: 15,
      potassium_level: 150,
      organic_matter_percent: 2,
    };

    const recommendation = calculateNPKRecommendation(
      soilData,
      crop_name || "default",
      area_ropani || 1
    );

    console.log(`[SOIL-ADVISORY] Generated recommendation for ${crop_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        soil_test: soilTest,
        recommendation,
        has_soil_data: !!soilTest,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SOIL-ADVISORY] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
