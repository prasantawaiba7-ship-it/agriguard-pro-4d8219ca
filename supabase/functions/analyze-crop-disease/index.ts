import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Step 1: Image analysis prompt - gets structured JSON from vision model
const IMAGE_ANALYSIS_PROMPT = `You are an expert plant pathologist and entomologist specializing in Nepali/South Asian crops. 
Analyze the provided crop image to identify any diseases, pests, insects, or nutrient deficiencies.

Return ONLY a JSON object with this exact structure:
{
  "disease_id": "unique_id_like_rice_blast",
  "isHealthy": boolean,
  "issueType": "disease" | "pest" | "deficiency" | "healthy",
  "detectedIssue": "Name in Nepali",
  "detectedIssueEnglish": "English name",
  "confidence": 0.0-1.0,
  "severity": "low" | "medium" | "high" | null,
  "affectedPart": "leaves/stem/fruit/roots/whole plant",
  "symptoms_keypoints": ["लक्षण १ नेपालीमा", "लक्षण २ नेपालीमा"],
  "causes": ["cause1", "cause2"],
  "recommended_chemicals": [
    {
      "name": "औषधिको नाम (नेपालमा उपलब्ध)",
      "dose": "मात्रा र प्रयोग विधि",
      "usage_note": "प्रयोग सम्बन्धी टिप्पणी"
    }
  ],
  "organic_treatment": {
    "name": "जैविक उपचार नाम",
    "preparation": "तयारी विधि",
    "application": "प्रयोग विधि"
  },
  "management_practices": ["व्यवस्थापन विधि १", "व्यवस्थापन विधि २"],
  "preventive_measures": ["रोकथाम १", "रोकथाम २"],
  "possible_alternatives": ["अर्को सम्भावित रोग/कीरा"],
  "when_to_seek_help": "कहिले विशेषज्ञसँग जाने",
  "estimated_recovery_time": "समय अवधि"
}

Be practical and specific to Nepali farming conditions. Suggest locally available treatments.`;

// Step 2: Nepali report generation prompt
const NEPALI_REPORT_PROMPT = `You are an agricultural assistant for Nepali farmers. 

Your job is to generate a clear, accurate disease report in Nepali language, based on structured data from an image disease classifier.

### ROLE & STYLE
- Write only in Nepali.
- Use simple, farmer-friendly words, not very technical academic language.
- Be concise but complete.
- Organize output with short headings and bullet points.
- Do NOT invent any chemical names or doses that are not present in the input data.
- If some information is missing in the input, simply skip it instead of guessing.

### OUTPUT STRUCTURE (in Nepali)

Follow this exact structure:

1) शीर्षक (Title)
- एक लाइनमा: "<बालीको नाम> : <रोगको नाम> को विवरण"

2) संक्षिप्त परिचय
- 2–3 वाक्यमा:
  - यो कुन बालीको रोग हो,
  - किसानको खेत (स्थान र severity) को सन्दर्भ दिनुहोस्,
  - यदि confidence कम छ भने स्पष्ट रूपमा उल्लेख गर्नुहोस् कि अनुमान हुन सक्छ।

3) रोगको मुख्य लक्षणहरू
- "मुख्य लक्षणहरू:" शीर्षक राख्नुहोस्।
- Bullet list मा input मा आएका symptoms_keypoints मात्र प्रयोग गरेर 4–8 बुँदामा लक्षणहरू लेख्नुहोस्।
- आफ्नो तर्फबाट नयाँ लक्षण नबनाउनुहोस्।

4) उपचार विधि (औषधि केन्द्रित)
- "उपचार विधि:" शीर्षक राख्नुहोस्।
- यदि recommended_chemicals खाली छैन भने:
  - प्रत्येक औषधि अलग bullet मा:
    - औषधिको नाम,
    - dose र प्रयोग तरिका,
    - स्प्रे गर्ने समय/अन्तराल यदि दिइएको छ भने।
- यदि recommended_chemicals खाली वा बहुत कम छ भने:
  - सामान्य वाक्य लेख्नुहोस् कि "औषधिको विस्तृत सिफारिस उपलब्ध छैन, नजिकको कृषि प्राविधिकसँग परामर्श गर्नुहोस्।" 

5) जैविक उपचार
- "जैविक उपचार:" शीर्षक राख्नुहोस्।
- organic_treatment मा दिइएको जानकारी सरल भाषामा राख्नुहोस्।

6) खेती व्यवस्थापन र रोकथाम
- "व्यवस्थापन र रोकथाम:" शीर्षक राख्नुहोस्।
- management_practices र preventive_measures array मा दिइएका बुँदाहरूलाई bullet list मा राख्नुहोस्।

7) सावधानी तथा Disclaimer
- "सावधानी:" शीर्षक राख्नुहोस्।
- 2–3 bullet:
  - यो डिजिटल अनुमानमात्र हो,
  - नजिकको कृषि प्राविधिक वा स्थानीय कृषि ज्ञान केन्द्रसँग परामर्श गर्नुपर्ने,
  - औषधि प्रयोग गर्दा लेबलमा लेखिए अनुसार मात्र प्रयोग गर्नुपर्ने।

### CONFIDENCE HANDLING

- If confidence >= 0.8: सामान्य ढङ्गले report लेख्नुहोस्।
- If 0.5 <= confidence < 0.8: परिचय भागमा "यो नतिजा अनुमान मात्र हो" लेख्नुहोस्।
- If confidence < 0.5: सुरूवातमै बलियो चेतावनी लेख्नुहोस् र औषधि सिफारिस नगर्नुहोस्।

Use only the facts from the JSON input. Do not invent new information.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, cropType, description, language = 'ne', farmerLocation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageUrl) {
      throw new Error("Image URL is required");
    }

    console.log("Step 1: Analyzing image for disease/pest detection...");

    // Step 1: Get structured data from image
    const imageAnalysisPrompt = `Analyze this crop image for diseases, pests, or nutrient deficiencies.
${cropType ? `Crop Type: ${cropType}` : ''}
${description ? `Farmer's Description: ${description}` : ''}
${farmerLocation ? `Location: ${farmerLocation}` : ''}

Provide detailed diagnosis in Nepali with locally available treatments.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: IMAGE_ANALYSIS_PROMPT },
          { 
            role: "user", 
            content: [
              { type: "text", text: imageAnalysisPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Service busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Service limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await imageResponse.text();
      console.error("Image analysis error:", imageResponse.status, errorText);
      throw new Error("Failed to analyze image");
    }

    const imageData = await imageResponse.json();
    const analysisText = imageData.choices?.[0]?.message?.content;
    
    let structuredData;
    try {
      structuredData = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse image analysis JSON:", analysisText);
      structuredData = { 
        isHealthy: true,
        detectedIssue: "पहिचान गर्न सकिएन",
        confidence: 0.3,
        severity: null
      };
    }

    console.log("Step 1 complete. Detected:", structuredData.detectedIssue);

    // Enrich structured data with crop and location info
    const enrichedData = {
      language: "Nepali",
      crop_name: cropType || "बाली",
      crop_scientific_name: "",
      disease_name: structuredData.detectedIssue || structuredData.detectedIssueEnglish || "Unknown",
      disease_id: structuredData.disease_id || "unknown",
      confidence: structuredData.confidence || 0.5,
      severity: structuredData.severity === "low" ? "सामान्य" : 
                structuredData.severity === "medium" ? "मध्यम" : 
                structuredData.severity === "high" ? "गम्भीर" : "अज्ञात",
      farmer_location: farmerLocation || "",
      symptoms_keypoints: structuredData.symptoms_keypoints || structuredData.symptoms || [],
      recommended_chemicals: structuredData.recommended_chemicals || [],
      organic_treatment: structuredData.organic_treatment || null,
      management_practices: [
        ...(structuredData.management_practices || []),
        ...(structuredData.preventive_measures || structuredData.preventiveMeasures || [])
      ],
      possible_alternatives: structuredData.possible_alternatives || [],
      when_to_seek_help: structuredData.when_to_seek_help || structuredData.whenToSeekHelp || "",
      // Keep original structured data for frontend use
      ...structuredData
    };

    console.log("Step 2: Generating Nepali report...");

    // Step 2: Generate Nepali report
    const reportResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: NEPALI_REPORT_PROMPT },
          { 
            role: "user", 
            content: `Generate a Nepali disease report using this data:\n\n${JSON.stringify(enrichedData, null, 2)}`
          }
        ],
      }),
    });

    let nepaliReport = "";
    if (reportResponse.ok) {
      const reportData = await reportResponse.json();
      nepaliReport = reportData.choices?.[0]?.message?.content || "";
      console.log("Step 2 complete. Report generated.");
    } else {
      console.error("Report generation failed, using structured data only");
    }

    // Return both structured data and formatted report
    const finalResponse = {
      ...enrichedData,
      nepaliReport,
      // Ensure backward compatibility with existing frontend
      isHealthy: enrichedData.isHealthy,
      issueType: enrichedData.issueType || "disease",
      detectedIssue: enrichedData.disease_name,
      detectedIssueEnglish: enrichedData.detectedIssueEnglish,
      confidence: enrichedData.confidence,
      severity: structuredData.severity,
      affectedPart: enrichedData.affectedPart,
      symptoms: enrichedData.symptoms_keypoints,
      causes: enrichedData.causes,
      organicTreatment: enrichedData.organic_treatment ? 
        `${enrichedData.organic_treatment.name}: ${enrichedData.organic_treatment.preparation}. ${enrichedData.organic_treatment.application}` : "",
      chemicalTreatment: enrichedData.recommended_chemicals?.[0] ? 
        `${enrichedData.recommended_chemicals[0].name} - ${enrichedData.recommended_chemicals[0].dose}` : "",
      treatment: enrichedData.recommended_chemicals?.map((c: { name: string; dose: string }) => `${c.name}: ${c.dose}`).join('\n') || 
                 enrichedData.organic_treatment?.application || "कृषि प्राविधिकसँग सल्लाह लिनुहोस्",
      prevention: enrichedData.management_practices,
      preventiveMeasures: enrichedData.management_practices,
      whenToSeekHelp: enrichedData.when_to_seek_help,
      estimatedRecoveryTime: enrichedData.estimated_recovery_time
    };

    return new Response(JSON.stringify(finalResponse), {
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
