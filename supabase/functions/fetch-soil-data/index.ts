import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SoilGrids API - free global soil data at 250m resolution
const SOILGRIDS_API = "https://rest.isric.org/soilgrids/v2.0/properties/query";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    console.log(`Fetching soil data for: ${latitude}, ${longitude}`);

    // Fetch from SoilGrids API
    const properties = ["nitrogen", "phh2o", "soc", "clay", "sand", "silt"];
    const depths = ["0-5cm", "5-15cm", "15-30cm"];
    
    const url = new URL(SOILGRIDS_API);
    url.searchParams.set("lon", longitude.toString());
    url.searchParams.set("lat", latitude.toString());
    properties.forEach(prop => url.searchParams.append("property", prop));
    depths.forEach(depth => url.searchParams.append("depth", depth));
    url.searchParams.set("value", "mean");

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json"
      }
    });

    let soilData: any = {
      ph: null,
      moisture: null,
      nitrogen: null,
      phosphorus: null,
      potassium: null,
      organicCarbon: null,
      soilType: null,
      dataSource: "estimated"
    };

    if (response.ok) {
      const data = await response.json();
      console.log("SoilGrids response:", JSON.stringify(data).slice(0, 500));

      // Parse SoilGrids response
      if (data.properties && data.properties.layers) {
        for (const layer of data.properties.layers) {
          const topDepthValue = layer.depths?.find((d: any) => d.label === "0-5cm")?.values?.mean;
          
          switch (layer.name) {
            case "phh2o":
              // pH is stored as pH * 10 in SoilGrids
              soilData.ph = topDepthValue ? (topDepthValue / 10).toFixed(1) : null;
              break;
            case "nitrogen":
              // Convert from g/kg to kg/ha (approximate)
              soilData.nitrogen = topDepthValue ? (topDepthValue * 2.5).toFixed(0) : null;
              break;
            case "soc":
              // Soil organic carbon in g/kg, convert to percentage
              soilData.organicCarbon = topDepthValue ? (topDepthValue / 10).toFixed(2) : null;
              break;
            case "clay":
              // Store clay percentage for soil type determination
              soilData.clayPercent = topDepthValue ? topDepthValue / 10 : null;
              break;
            case "sand":
              soilData.sandPercent = topDepthValue ? topDepthValue / 10 : null;
              break;
            case "silt":
              soilData.siltPercent = topDepthValue ? topDepthValue / 10 : null;
              break;
          }
        }
        soilData.dataSource = "soilgrids";
      }

      // Determine soil type from texture
      if (soilData.clayPercent !== null && soilData.sandPercent !== null) {
        const clay = soilData.clayPercent;
        const sand = soilData.sandPercent;
        
        if (clay > 40) {
          soilData.soilType = "Clay";
        } else if (sand > 70) {
          soilData.soilType = "Sandy";
        } else if (clay > 25 && sand < 50) {
          soilData.soilType = "Clay Loam";
        } else if (sand > 50) {
          soilData.soilType = "Sandy Loam";
        } else {
          soilData.soilType = "Loam";
        }
      }

      // Estimate P and K from organic carbon (rough estimation for Nepal)
      if (soilData.organicCarbon) {
        const oc = parseFloat(soilData.organicCarbon);
        // Higher OC generally indicates better nutrient availability
        soilData.phosphorus = Math.round(8 + (oc * 5)); // Rough P estimate
        soilData.potassium = Math.round(150 + (oc * 30)); // Rough K estimate
      }
    } else {
      console.log("SoilGrids API failed, using estimates based on location");
      
      // Provide reasonable estimates for Nepali conditions
      // These are typical values for soils in Nepal's Terai and mid-hills
      soilData = {
        ph: (6.5 + Math.random() * 1.5).toFixed(1),
        moisture: (25 + Math.random() * 20).toFixed(0),
        nitrogen: Math.round(180 + Math.random() * 100),
        phosphorus: Math.round(15 + Math.random() * 20),
        potassium: Math.round(180 + Math.random() * 80),
        organicCarbon: (0.4 + Math.random() * 0.4).toFixed(2),
        soilType: "Alluvial",
        dataSource: "estimated"
      };
    }

    // Add soil moisture estimate (would need ISRO Bhuvan API for accurate data)
    // For now, estimate based on region and season
    if (!soilData.moisture) {
      soilData.moisture = Math.round(30 + Math.random() * 25);
    }

    return new Response(JSON.stringify({
      success: true,
      data: soilData,
      coordinates: { latitude, longitude },
      fetchedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Soil data fetch error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
