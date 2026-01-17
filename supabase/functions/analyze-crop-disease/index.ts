import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISEASE_ANALYSIS_PROMPT = `You are an expert plant pathologist and entomologist specializing in Nepali/South Asian crops. Analyze the provided crop image to identify any diseases, pests, insects, or nutrient deficiencies.

IMPORTANT: Identify the PRIMARY issue type:
- "disease" - fungal, bacterial, viral infections
- "pest" - insects like aphids, caterpillars, beetles, borers, mites
- "deficiency" - nutrient deficiencies (nitrogen, potassium, etc.)
- "healthy" - if the crop appears healthy

Provide your analysis as a JSON object with this structure:
{
  "isHealthy": boolean,
  "issueType": "disease" | "pest" | "deficiency" | "healthy",
  "detectedIssue": "Name of disease/pest/deficiency in local language if possible",
  "detectedIssueEnglish": "English name for reference",
  "confidence": 0.0-1.0,
  "severity": "low" | "medium" | "high" | null,
  "affectedPart": "leaves/stem/fruit/roots/whole plant",
  "symptoms": ["symptom1 in Nepali", "symptom2 in Nepali"],
  "causes": ["cause1", "cause2"],
  "pestInfo": {
    "scientificName": "Scientific name if pest",
    "lifecycle": "Brief lifecycle description",
    "activeSeasons": ["monsoon", "summer", etc.],
    "hostCrops": ["rice", "wheat", etc.]
  },
  "immediateActions": [
    {
      "action": "What to do immediately",
      "materials": "Required materials",
      "frequency": "How often"
    }
  ],
  "organicTreatment": {
    "name": "Organic solution name",
    "preparation": "How to prepare (neem, garlic, etc.)",
    "application": "How to apply"
  },
  "chemicalTreatment": {
    "name": "Chemical/product name available in Nepal",
    "dosage": "Recommended dosage",
    "precautions": ["safety tip1", "safety tip2"]
  },
  "biologicalControl": {
    "naturalEnemies": ["ladybugs", "parasitic wasps", etc.],
    "trapCrops": ["marigold", etc.],
    "culturalPractices": ["crop rotation", etc.]
  },
  "preventiveMeasures": ["tip1 in Nepali", "tip2 in Nepali", "tip3 in Nepali"],
  "whenToSeekHelp": "When farmer should consult local कृषि प्राविधिक",
  "estimatedRecoveryTime": "X days/weeks if treated properly",
  "economicThreshold": "When pest damage justifies treatment cost"
}

Be practical and specific to Nepali farming conditions. Suggest locally available treatments. Provide responses in Nepali when language=ne.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, cropType, description, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    const userPrompt = `Please analyze this crop image for any diseases, pests, or nutrient deficiencies.

${cropType ? `Crop Type: ${cropType}` : ''}
${description ? `Farmer's Description: ${description}` : ''}

${language !== 'en' ? `Please provide treatment names and instructions also in ${language}.` : ''}

Analyze the image and provide detailed diagnosis and treatment recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: DISEASE_ANALYSIS_PROMPT },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Service busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = { 
        isHealthy: true,
        detectedIssue: "Unable to determine",
        confidence: 0.5,
        description: analysisText
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Disease analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
