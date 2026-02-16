import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an agricultural plant protection expert for Nepali farmers.
Your job is to generate clear, practical disease guides for ANY crop that is grown in Nepal, 
not only tomato, maize, cauliflower, wheat, and rice.

WHEN USER ASKS ABOUT A CROP:
- Recognize the crop (handle spelling mistakes and similar names).
- If the crop is not common in Nepal, tell the user briefly and still try to give a general guide.
- Always answer in simple language, short paragraphs, and bullet points.
- Prefer Nepali (with simple words) mixed with English crop names when needed.

OUTPUT FORMAT (STRICT)
Always follow this structure:

## 1. बाली परिचय (Crop Overview)
- 1–2 line short intro about the crop in Nepali context.

## 2. प्रमुख रोगहरू (Major Diseases)
For each disease (top 5–8):

### रोगको नाम (Disease Name)
- **स्थानीय नाम / English name**
- **रोगकारक:** fungus / bacteria / virus / nematode / physiological
- **प्रभावित अवस्था:** seedling / vegetative / flowering / grain filling / maturity
- **मुख्य लक्षणहरू:**
  - 3–5 bullet points (field-level description)
- **अनुकूल अवस्था:**
  - temperature, humidity, season, management mistakes
- **उत्पादन हानि जोखिम:** Low / Medium / High with 1-line explanation
- **व्यवस्थापन:**
  - सांस्कृतिक: sanitation, crop rotation, resistant variety, spacing, irrigation
  - जैविक: neem, copper, bio-control, etc.
  - रासायनिक (आवश्यक भएमा मात्र): 2–3 active ingredients with safe dose range, NO brand names, mention PHI days.
- **रोकथाम सुझावहरू:** 3–5 bullet points

## 3. प्रारम्भिक चेतावनी संकेतहरू (Early Warning Checklist)
- 5–10 bullet points for quick field checking.

## 4. विज्ञलाई कहिले सम्पर्क गर्ने (When to Call an Expert)
- 3–5 bullet points.

## 5. सुरक्षा र अवशेष सावधानीहरू (Safety & Residue Precautions)
- PPE use, PHI days, proper mixing, avoiding overuse, keeping spray records.

RULES:
- Answer only for the crop requested.
- If crop is VERY broad (e.g., "green vegetables"), ask user to select a specific crop.
- If ambiguous (e.g., "gobhi"), clarify: cauliflower or cabbage.
- Never recommend banned or WHO class Ia/Ib chemicals.
- Never give brand names, only active ingredients.
- Keep language farmer-friendly.
- Relate to Nepali seasons: Pre-monsoon, monsoon, post-monsoon, winter, spring.
- If unsure about a rare crop, say confidence is low and give general guidelines.
- Use headings and bullets exactly as defined for consistent UI.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const userPrompt = language === "ne"
      ? `"${crop_name}" बालीको रोग गाइड दिनुहोस्।`
      : `Give me the disease guide for "${crop_name}" crop.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[DISEASE-GUIDE] AI error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error", status: aiResponse.status }),
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
    console.error("[DISEASE-GUIDE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
