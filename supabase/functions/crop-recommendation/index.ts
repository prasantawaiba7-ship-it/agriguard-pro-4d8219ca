import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoilData {
  ph: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicCarbon?: number;
  soilType?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface PlotInfo {
  latitude: number;
  longitude: number;
  areaHectares: number;
  state: string;
  district: string;
  season: string;
  previousCrop?: string;
}

const RECOMMENDATION_PROMPT = `You are an expert agricultural scientist specializing in Nepali farming conditions. Analyze the provided soil, weather, and location data to recommend the best crops for the farmer.

Consider:
1. Soil NPK levels and pH for crop suitability
2. Current weather and seasonal patterns
3. Regional farming practices and climate
4. Crop rotation benefits (if previous crop mentioned)
5. Market demand and profitability
6. Water requirements vs moisture availability
7. Sustainability and soil health

Provide your response as a JSON object with this structure:
{
  "recommendations": [
    {
      "crop": "Crop name",
      "suitabilityScore": 0.0-1.0,
      "expectedYieldPerHectare": "X quintals",
      "estimatedProfitPerHectare": "रु.X-Y",
      "waterRequirement": "low/medium/high",
      "growthDuration": "X days",
      "bestPractices": ["tip1", "tip2"],
      "inputsNeeded": {
        "seeds": "X kg/hectare",
        "fertilizer": "recommendation",
        "irrigation": "frequency"
      }
    }
  ],
  "soilHealthScore": 0.0-1.0,
  "sustainabilityScore": 0.0-1.0,
  "soilImprovementTips": ["tip1", "tip2"],
  "reasoning": "Brief explanation of recommendations"
}

Recommend 3-5 crops, ranked by suitability. Use realistic yield and profit estimates for Nepali conditions.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { soilData, weatherData, plotInfo, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `
Analyze this farm data and recommend suitable crops:

SOIL DATA:
- pH Level: ${soilData?.ph || 'Unknown'}
- Moisture: ${soilData?.moisture || 'Unknown'}%
- Nitrogen (N): ${soilData?.nitrogen || 'Unknown'} kg/ha
- Phosphorus (P): ${soilData?.phosphorus || 'Unknown'} kg/ha
- Potassium (K): ${soilData?.potassium || 'Unknown'} kg/ha
- Organic Carbon: ${soilData?.organicCarbon || 'Unknown'}%
- Soil Type: ${soilData?.soilType || 'Unknown'}

WEATHER DATA:
- Temperature: ${weatherData?.temperature || 'Unknown'}°C
- Humidity: ${weatherData?.humidity || 'Unknown'}%
- Expected Rainfall: ${weatherData?.rainfall || 'Unknown'} mm

PLOT INFORMATION:
- Location: ${plotInfo?.district || 'Unknown'}, ${plotInfo?.state || 'Unknown'}
- Coordinates: ${plotInfo?.latitude || 'Unknown'}, ${plotInfo?.longitude || 'Unknown'}
- Area: ${plotInfo?.areaHectares || 'Unknown'} hectares
- Season: ${plotInfo?.season || 'Current'}
- Previous Crop: ${plotInfo?.previousCrop || 'Not specified'}

${language !== 'en' ? `Please provide the response with crop names and tips also translated to ${language}.` : ''}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: RECOMMENDATION_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get crop recommendations");
    }

    const data = await response.json();
    const recommendationText = data.choices?.[0]?.message?.content;
    
    let recommendations;
    try {
      recommendations = JSON.parse(recommendationText);
    } catch {
      recommendations = { 
        recommendations: [],
        reasoning: recommendationText,
        soilHealthScore: 0.7,
        sustainabilityScore: 0.7
      };
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Crop recommendation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
