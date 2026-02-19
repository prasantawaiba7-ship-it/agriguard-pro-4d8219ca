import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive, consistency-focused image analysis prompt for Kishan Sathi
function getImageAnalysisPrompt(language: string) {
  const langInstruction = language === 'en'
    ? 'Respond entirely in English. Use English disease names.'
    : 'Respond in Nepali for disease names and notes. Use Nepali farmer-friendly terms.';

  return `You are the crop disease image diagnosis engine for **Kishan Sathi – Nepal Farmer GPT**.
The input is a single plant image (mostly leaves) plus optional text context like crop name, location, and crop stage.

Your goals:
1) Be as CONSISTENT as possible when the same image is analyzed multiple times.
2) Never be over-confident on uncertain images.
3) ${langInstruction}

### Image Analysis Protocol
For each image:
- Carefully inspect the whole leaf (shape, color, spots, edges, texture), background, and overall plant health.
- Use your best knowledge of plant diseases, pests, nutrient deficiencies, and abiotic stresses relevant to Nepal/South Asia.
- Cross-reference visible symptoms with known disease patterns for the identified or stated crop.

### Nepal/South Asia Crop Disease Knowledge Base
Use this knowledge to improve accuracy:
- **धान (Rice)**: Blast (pyricularia), Sheath Blight, Brown Spot, Bacterial Leaf Blight, Stem Borer, Brown Plant Hopper
- **गहुँ (Wheat)**: Yellow Rust, Brown Rust, Loose Smut, Powdery Mildew, Helminthosporium
- **मकै (Maize)**: Stem Borer, Fall Armyworm, Turcicum Leaf Blight, Downy Mildew, Grey Leaf Spot
- **आलु (Potato)**: Late Blight, Early Blight, Black Scurf, Viral Diseases (mosaic, leaf roll)
- **गोलभेडा (Tomato)**: Leaf Curl Virus, Bacterial Wilt, Fusarium Wilt, Blossom End Rot, Early Blight, Septoria Leaf Spot
- **तरकारी**: Diamond Back Moth, Aphids, Red Spider Mite, Powdery Mildew, Anthracnose
- **प्याज (Onion)**: Purple Blotch, Stemphylium Blight, Thrips
- **तोरी (Mustard)**: White Rust, Alternaria Blight, Aphids

Respond in STRICT JSON with this schema:
{
  "status": "ok" | "uncertain",
  "crop": "string | null",
  "isHealthy": boolean,
  "top_diseases": [
    {
      "disease_id": "unique_snake_case_id",
      "name": "Disease name${language === 'ne' ? ' (नेपालीमा)' : ''}",
      "name_en": "English name",
      "type": "disease" | "pest" | "nutrient_deficiency" | "abiotic" | "healthy",
      "confidence": 0.0,
      "severity": "low" | "medium" | "high" | null,
      "affectedPart": "leaves/stem/fruit/roots/whole plant",
  "short_reason": "1-2 sentence explanation${language === 'ne' ? ' नेपालीमा' : ''}",
      "local_name": "Common local/farmer name for this problem${language === 'ne' ? ' (नेपालीमा, किसानले चिन्ने नाम)' : ''}",
      "cause_short": "1 short line explaining the cause in very simple farmer language${language === 'ne' ? ' (सरल नेपालीमा)' : ''}",
      "symptoms": ["symptom1", "symptom2"],
      "causes": ["cause1", "cause2"],
      "recommended_chemicals": [
        {
          "name": "Generic active ingredient name (available in Nepal/South Asia)",
          "dose": "Dosage and application method",
          "usage_note": "Usage notes including safety"
        }
      ],
      "organic_treatment": {
        "name": "Organic treatment name",
        "preparation": "How to prepare",
        "application": "How to apply"
      },
      "management_practices": ["practice1", "practice2"],
      "preventive_measures": ["prevention1", "prevention2"],
      "recommended_actions": ["action1", "action2"]
    }
  ],
  "overall_confidence": 0.0,
  "notes_for_doctor": "string",
  "possible_alternatives": ["other disease/pest"],
  "when_to_seek_help": "When to consult an expert",
  "estimated_recovery_time": "Time estimate"
}

CONFIDENCE AND UNCERTAINTY RULES:
- overall_confidence must match the top disease probability (0-1).
- If overall_confidence < 0.6, set "status": "uncertain" and list 2-3 plausible options in top_diseases.
- When "status": "uncertain", say in "notes_for_doctor" that more photos (different angles, close-ups, healthy vs sick leaves) and text description are needed.
- Never guess a specific disease with high confidence if the symptom pattern is partial, unclear, or could match multiple problems.

CONSISTENCY RULES:
- Work deterministically. Follow a systematic visual checklist: leaf color → spot pattern → spot shape → spot distribution → leaf edges → stem → overall plant.
- Prefer the same top disease and similar confidence for the same image.
- If there is real ambiguity, keep confidence moderate (0.4-0.6) and mark "status": "uncertain" instead of randomly switching diseases.

TREATMENT RULES:
- Follow IPM (Integrated Pest Management) principles: cultural control, sanitation, resistant varieties first.
- If you mention chemical control, use generic active ingredient names and say the exact product/dose must be confirmed with a local agrovet or agriculture officer.
- Never give exact doses for very toxic or restricted chemicals.
- Always include organic/cultural alternatives alongside chemical options.
- Emphasize PPE (gloves, mask) and pre-harvest intervals for any chemical recommendation.

If the image is unclear/blurry or shows no clear disease:
- "status": "uncertain"
- overall_confidence low (0.2-0.4)
- notes_for_doctor explaining the photo is insufficient for safe diagnosis.

Be practical and specific to Nepali/South Asian farming conditions.`;
}

function getReportPrompt(language: string) {
  if (language === 'en') {
    return `You are an agricultural assistant for farmers in Nepal/South Asia.
Generate a clear, accurate disease report in English based on structured diagnosis data.

RULES:
- Write in simple, farmer-friendly English.
- Be concise but complete.
- Use short headings and bullet points.
- Do NOT invent chemical names or doses not in the input data.
- If info is missing, skip it.

STRUCTURE:
1) Title: "<Crop>: <Disease> Report"
2) Brief Introduction (2-3 sentences, mention confidence level)
3) Key Symptoms (bullet list from input only)
4) Treatment (chemicals from input, or "consult local technician")
5) Organic Treatment
6) Management & Prevention
7) Caution: digital estimate only, consult local agriculture office, follow label instructions

CONFIDENCE HANDLING:
- confidence >= 0.8: Normal report.
- 0.5-0.8: Note "this is an estimate only."
- < 0.5: Strong warning, no chemical recommendations.

AUDIO SCRIPT:
At the very end, add a section called "AUDIO_SCRIPT:" followed by a 20-40 second spoken summary in very simple English:
- Start with what the problem is.
- Then 2-3 immediate actions.
- End with a safety reminder.
Keep it under 80 words, conversational tone.

Use only facts from input. Do not invent information.`;
  }

  return `तपाईं नेपाली किसानहरूको लागि कृषि सहायक हुनुहुन्छ।
संरचित डाटाबाट स्पष्ट, सटीक रोग विवरण नेपालीमा बनाउनुहोस्।

नियमहरू:
- सरल, किसानमैत्री नेपालीमा लेख्नुहोस्।
- संक्षिप्त तर पूर्ण।
- छोटा शीर्षक र बुलेट पोइन्ट।
- Input मा नभएको औषधिको नाम/मात्रा नबनाउनुहोस्।

संरचना:
1) शीर्षक: "<बाली>: <रोग> को विवरण"
2) संक्षिप्त परिचय (2-3 वाक्य, confidence उल्लेख)
3) मुख्य लक्षणहरू (input बाट मात्र)
4) उपचार विधि (औषधि input बाट, वा "नजिकको कृषि प्राविधिकसँग परामर्श")
5) जैविक उपचार
6) व्यवस्थापन र रोकथाम
7) सावधानी: डिजिटल अनुमान मात्र, कृषि कार्यालयसँग परामर्श, लेबल अनुसार प्रयोग

CONFIDENCE:
- >= 0.8: सामान्य report।
- 0.5-0.8: "अनुमान मात्र हो" उल्लेख।
- < 0.5: कडा चेतावनी, औषधि सिफारिस नगर्ने।

अडियो स्क्रिप्ट:
अन्तिममा "AUDIO_SCRIPT:" भनेर एउटा खण्ड थप्नुहोस् जसमा 20-40 सेकेन्डको सरल नेपाली बोल्ने स्क्रिप्ट हुनुपर्छ:
- पहिले समस्या के हो भन्ने।
- त्यसपछि 2-3 तुरुन्तै गर्ने कदम।
- अन्तिममा सावधानी/सल्लाह।
80 शब्दभन्दा कम राख्नुस्, किसानसँग कुरा गरे जस्तो सरल भाषामा।

Input को तथ्य मात्र प्रयोग गर्नुहोस्।`;
}

// Run a single Gemini analysis call
async function runSingleAnalysis(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string
): Promise<any> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      temperature: 0,
      top_p: 1,
      messages: [
        { role: "system", content: systemPrompt },
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
    const status = response.status;
    if (status === 429 || status === 402) {
      throw { status, message: status === 429 ? "Service busy. Please try again in a moment." : "Service limit reached. Please try again later." };
    }
    const errorText = await response.text();
    console.error("Analysis call error:", status, errorText);
    throw { status: 500, message: "Failed to analyze image" };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse analysis JSON:", text);
    return null;
  }
}

// Consensus: run N calls, pick majority disease
function buildConsensus(results: any[]): { consensus: any; consensusReached: boolean } {
  const valid = results.filter(r => r !== null);
  if (valid.length === 0) {
    return { consensus: null, consensusReached: false };
  }
  if (valid.length === 1) {
    return { consensus: valid[0], consensusReached: false };
  }

  // Count top disease names
  const diseaseCount: Record<string, { count: number; results: any[] }> = {};
  for (const r of valid) {
    const topName = r.top_diseases?.[0]?.name_en || r.top_diseases?.[0]?.name || r.detectedIssueEnglish || "unknown";
    const key = topName.toLowerCase().trim();
    if (!diseaseCount[key]) diseaseCount[key] = { count: 0, results: [] };
    diseaseCount[key].count++;
    diseaseCount[key].results.push(r);
  }

  // Find majority
  const sorted = Object.entries(diseaseCount).sort((a, b) => b[1].count - a[1].count);
  const [topKey, topData] = sorted[0];
  const majorityThreshold = Math.ceil(valid.length / 2);

  if (topData.count >= majorityThreshold) {
    // Pick the result with highest confidence from majority group
    const best = topData.results.reduce((a, b) => {
      const confA = a.overall_confidence ?? a.confidence ?? 0;
      const confB = b.overall_confidence ?? b.confidence ?? 0;
      return confA >= confB ? a : b;
    });
    return { consensus: best, consensusReached: true };
  }

  // No majority — mark uncertain, use result with most detail
  const bestOverall = valid.reduce((a, b) => {
    const confA = a.overall_confidence ?? a.confidence ?? 0;
    const confB = b.overall_confidence ?? b.confidence ?? 0;
    return confA >= confB ? a : b;
  });
  bestOverall.status = "uncertain";
  if (bestOverall.overall_confidence > 0.5) bestOverall.overall_confidence = 0.5;
  bestOverall.notes_for_doctor = (bestOverall.notes_for_doctor || "") +
    " Multiple analyses gave different results. Please provide more photos from different angles.";
  return { consensus: bestOverall, consensusReached: false };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, cropType, description, language = 'ne', farmerLocation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!imageUrl) throw new Error("Image URL is required");

    const lang = language === 'en' ? 'en' : 'ne';
    const systemPrompt = getImageAnalysisPrompt(lang);

    const userPrompt = `Analyze this crop image for diseases, pests, or nutrient deficiencies.
${cropType ? `Crop Type: ${cropType}` : ''}
${description ? `Farmer's Description: ${description}` : ''}
${farmerLocation ? `Location: ${farmerLocation}` : ''}

Provide detailed diagnosis with locally available treatments.`;

    console.log(`Starting consensus analysis (3 calls, language: ${lang})...`);

    // Step 1: Run 3 parallel Gemini calls for consensus
    const analysisPromises = [
      runSingleAnalysis(LOVABLE_API_KEY, systemPrompt, userPrompt, imageUrl),
      runSingleAnalysis(LOVABLE_API_KEY, systemPrompt, userPrompt, imageUrl),
      runSingleAnalysis(LOVABLE_API_KEY, systemPrompt, userPrompt, imageUrl),
    ];

    let results: any[];
    try {
      results = await Promise.all(analysisPromises);
    } catch (err: any) {
      // If rate limited or payment required, return that error
      if (err.status === 429 || err.status === 402) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    const { consensus: structuredData, consensusReached } = buildConsensus(results);

    if (!structuredData) {
      throw new Error("All analysis calls failed");
    }

    console.log(`Consensus: ${consensusReached ? 'YES' : 'NO'}. Top disease:`,
      structuredData.top_diseases?.[0]?.name_en || structuredData.top_diseases?.[0]?.name || "unknown");

    // Extract top disease for backward compatibility
    const topDisease = structuredData.top_diseases?.[0] || {};
    const overallConfidence = structuredData.overall_confidence ?? topDisease.confidence ?? 0.5;
    const status = structuredData.status || (overallConfidence >= 0.6 ? "ok" : "uncertain");

    // Build enriched data for report generation
    const severityLabel = lang === 'en'
      ? (topDisease.severity === "low" ? "Low" : topDisease.severity === "medium" ? "Medium" : topDisease.severity === "high" ? "Severe" : "Unknown")
      : (topDisease.severity === "low" ? "सामान्य" : topDisease.severity === "medium" ? "मध्यम" : topDisease.severity === "high" ? "गम्भीर" : "अज्ञात");

    const enrichedData = {
      language: lang === 'en' ? "English" : "Nepali",
      crop_name: cropType || structuredData.crop || (lang === 'en' ? "Crop" : "बाली"),
      disease_name: topDisease.name || topDisease.name_en || "Unknown",
      disease_id: topDisease.disease_id || "unknown",
      local_name: topDisease.local_name || topDisease.name || "",
      cause_short: topDisease.cause_short || topDisease.short_reason || "",
      confidence: overallConfidence,
      severity: severityLabel,
      danger_level: severityLabel,
      farmer_location: farmerLocation || "",
      symptoms_keypoints: topDisease.symptoms || [],
      recommended_chemicals: topDisease.recommended_chemicals || [],
      organic_treatment: topDisease.organic_treatment || null,
      what_to_do_now: [
        ...(topDisease.recommended_actions || []),
        ...(topDisease.management_practices || []).slice(0, 2)
      ],
      what_to_prevent_next_time: topDisease.preventive_measures || [],
      management_practices: [
        ...(topDisease.management_practices || []),
        ...(topDisease.preventive_measures || [])
      ],
      possible_alternatives: structuredData.possible_alternatives || [],
      when_to_seek_help: structuredData.when_to_seek_help || topDisease.short_reason || "",
      estimated_recovery_time: structuredData.estimated_recovery_time || "",
      consensus_status: status,
      consensus_reached: consensusReached,
      notes_for_doctor: structuredData.notes_for_doctor || "",
    };

    // Step 2: Generate report (skip if very uncertain)
    let nepaliReport = "";
    if (overallConfidence >= 0.3) {
      console.log(`Generating ${lang === 'en' ? 'English' : 'Nepali'} report...`);
      try {
        const reportResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0,
            top_p: 1,
            messages: [
              { role: "system", content: getReportPrompt(lang) },
              {
                role: "user",
                content: `Generate a ${lang === 'en' ? 'English' : 'Nepali'} disease report:\n\n${JSON.stringify(enrichedData, null, 2)}`
              }
            ],
          }),
        });
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          nepaliReport = reportData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("Report generation failed:", e);
      }
    }

    // Extract audio script from report if present
    let audioScript = "";
    if (nepaliReport.includes("AUDIO_SCRIPT:")) {
      const parts = nepaliReport.split("AUDIO_SCRIPT:");
      nepaliReport = parts[0].trim();
      audioScript = parts[1]?.trim() || "";
    }

    // Fallback audio script if not generated
    if (!audioScript) {
      const cropName = enrichedData.crop_name;
      const diseaseName = enrichedData.disease_name;
      const severity = enrichedData.danger_level;
      if (lang === 'ne') {
        audioScript = `तपाईंको ${cropName} मा ${diseaseName} देखिएको छ। गम्भीरता: ${severity}। `;
        if (enrichedData.what_to_do_now.length > 0) {
          audioScript += `तुरुन्तै गर्ने: ${enrichedData.what_to_do_now.slice(0, 2).join(', ')}। `;
        }
        audioScript += `नजिकको कृषि प्राविधिकसँग पनि सल्लाह लिनुहोस्।`;
      } else {
        audioScript = `Your ${cropName} shows ${diseaseName}. Severity: ${severity}. `;
        if (enrichedData.what_to_do_now.length > 0) {
          audioScript += `Do this now: ${enrichedData.what_to_do_now.slice(0, 2).join(', ')}. `;
        }
        audioScript += `Also consult your local agriculture officer.`;
      }
    }

    // Build backward-compatible response
    const defaultFallback = lang === 'en' ? "Consult an agricultural technician" : "कृषि प्राविधिकसँग सल्लाह लिनुहोस्";

    const finalResponse = {
      // New structured fields
      status,
      consensus_reached: consensusReached,
      top_diseases: structuredData.top_diseases || [],
      overall_confidence: overallConfidence,
      notes_for_doctor: enrichedData.notes_for_doctor,
      nepaliReport,
      audio_script: audioScript,
      // Farmer-friendly structured fields (spec-aligned)
      local_name: enrichedData.local_name,
      cause_short: enrichedData.cause_short,
      danger_level: enrichedData.danger_level,
      what_to_do_now: enrichedData.what_to_do_now,
      what_to_prevent_next_time: enrichedData.what_to_prevent_next_time,
      // Backward-compatible fields
      isHealthy: structuredData.isHealthy ?? (topDisease.type === "healthy"),
      issueType: topDisease.type || "disease",
      detectedIssue: enrichedData.disease_name,
      detectedIssueEnglish: topDisease.name_en || topDisease.name || "",
      disease_id: enrichedData.disease_id,
      confidence: overallConfidence,
      severity: topDisease.severity || null,
      affectedPart: topDisease.affectedPart || "",
      symptoms: enrichedData.symptoms_keypoints,
      symptoms_keypoints: enrichedData.symptoms_keypoints,
      causes: topDisease.causes || [],
      recommended_chemicals: enrichedData.recommended_chemicals,
      organic_treatment: enrichedData.organic_treatment,
      organicTreatment: enrichedData.organic_treatment
        ? `${enrichedData.organic_treatment.name}: ${enrichedData.organic_treatment.preparation}. ${enrichedData.organic_treatment.application}`
        : "",
      chemicalTreatment: enrichedData.recommended_chemicals?.[0]
        ? `${enrichedData.recommended_chemicals[0].name} - ${enrichedData.recommended_chemicals[0].dose}`
        : "",
      treatment: enrichedData.recommended_chemicals?.map((c: { name: string; dose: string }) => `${c.name}: ${c.dose}`).join('\n')
        || enrichedData.organic_treatment?.application || defaultFallback,
      prevention: enrichedData.management_practices,
      preventiveMeasures: enrichedData.management_practices,
      management_practices: enrichedData.management_practices,
      possible_alternatives: enrichedData.possible_alternatives,
      whenToSeekHelp: enrichedData.when_to_seek_help,
      when_to_seek_help: enrichedData.when_to_seek_help,
      estimatedRecoveryTime: enrichedData.estimated_recovery_time,
      estimated_recovery_time: enrichedData.estimated_recovery_time,
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
