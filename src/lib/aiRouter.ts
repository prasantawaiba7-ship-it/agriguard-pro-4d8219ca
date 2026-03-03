/**
 * Kishan Sathi – AI Router
 * 
 * Client-side language detection + intent classification + function selection.
 * This module is used by both the frontend (for UI hints) and mirrored in the
 * edge function for server-side routing.
 */

import {
  KISHAN_SATHI_FUNCTIONS,
  type KishanSathiFunction,
  type SupportedLanguage,
  type FunctionCategory,
} from "./kishanSathiFunctions";

// ─── Language Detection ──────────────────────────────────

const DEVANAGARI_RANGE = /[\u0900-\u097F]/;

/**
 * Detect whether a message is primarily Nepali or English.
 * Uses script detection (Devanagari = Nepali) + keyword heuristics.
 */
export function detectLanguage(text: string): SupportedLanguage {
  const chars = text.replace(/\s+/g, "");
  if (chars.length === 0) return "ne";

  let devanagariCount = 0;
  for (const ch of chars) {
    if (DEVANAGARI_RANGE.test(ch)) devanagariCount++;
  }

  const ratio = devanagariCount / chars.length;
  // If more than 30% Devanagari, treat as Nepali
  if (ratio > 0.3) return "ne";

  // Keyword fallback for Romanized Nepali
  const nepaliRomanKeywords = [
    "mero", "khet", "bali", "rog", "kira", "mal", "dhan", "makai",
    "gahu", "aalu", "golbheda", "mausam", "paani", "bazar",
    "kattha", "ropani", "bigha", "krishi", "kisan",
  ];
  const lowerText = text.toLowerCase();
  const nepaliWordHits = nepaliRomanKeywords.filter(kw => lowerText.includes(kw)).length;
  if (nepaliWordHits >= 2) return "ne";

  return "en";
}

// ─── Intent Classification ───────────────────────────────

interface IntentKeywords {
  category: FunctionCategory;
  keywords: string[];
}

const INTENT_PATTERNS: IntentKeywords[] = [
  {
    category: "disease_support",
    keywords: [
      "rog", "disease", "blight", "blast", "rust", "wilt", "rot", "virus",
      "kira", "pest", "insect", "aphid", "borer", "armyworm", "mite",
      "रोग", "कीरा", "झुलसा", "माहू", "लाही", "फफूँदी",
      "symptom", "लक्षण", "पात", "leaf", "spot", "yellow", "brown",
      "photo", "फोटो", "diagnos", "पहिचान",
    ],
  },
  {
    category: "fertilizer_support",
    keywords: [
      "fertilizer", "urea", "dap", "potash", "compost", "manure",
      "मल", "युरिया", "डीएपी", "पोटास", "कम्पोष्ट", "गोबर",
      "dose", "मात्रा", "कति", "how much", "schedule", "timing",
    ],
  },
  {
    category: "crop_planning",
    keywords: [
      "sow", "plant", "harvest", "seed", "variety", "nursery",
      "रोप", "बिउ", "काट", "जात", "बिरुवा",
      "when to", "कहिले", "season", "मौसम", "recommend", "सिफारिस",
      "crop plan", "बाली योजना",
    ],
  },
  {
    category: "weather_advice",
    keywords: [
      "weather", "rain", "frost", "heatwave", "temperature", "irrigation",
      "मौसम", "पानी", "वर्षा", "तुसारो", "गर्मी", "सिँचाइ",
      "forecast", "पूर्वानुमान", "kal ko", "भोलिको",
    ],
  },
  {
    category: "market_price",
    keywords: [
      "price", "market", "sell", "buy", "rate", "mandi",
      "मूल्य", "बजार", "बेच", "किन", "दर", "कालिमाटी",
      "कति पर्छ", "how much cost",
    ],
  },
  {
    category: "call_request",
    keywords: [
      "expert", "call", "talk", "consult", "technician",
      "विज्ञ", "कल", "कुरा", "सम्पर्क", "प्राविधिक",
      "phone", "फोन",
    ],
  },
  {
    category: "soil_support",
    keywords: [
      "soil", "माटो", "ph", "nutrient", "पोषक", "organic matter",
      "compost", "जैविक", "test", "जाँच",
    ],
  },
  {
    category: "admin_help",
    keywords: [
      "admin", "setting", "app", "bug", "error", "help",
      "प्रशासन", "सेटिङ", "एप", "समस्या", "त्रुटि",
      "ticket", "टिकट",
    ],
  },
];

/**
 * Classify user message intent into a function category.
 * Returns the best-matching category with a confidence score.
 */
export function classifyIntent(message: string): { category: FunctionCategory; confidence: number } {
  const lowerMessage = message.toLowerCase();
  const scores: Record<string, number> = {};

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (lowerMessage.includes(kw.toLowerCase())) {
        score += kw.length > 3 ? 2 : 1; // longer keywords get more weight
      }
    }
    if (score > 0) {
      scores[pattern.category] = score;
    }
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0) {
    const maxScore = entries[0][1];
    return {
      category: entries[0][0] as FunctionCategory,
      confidence: Math.min(maxScore / 10, 1), // normalize to 0-1
    };
  }

  // Default to general Q&A if no strong match
  return { category: "general_qa", confidence: 0.3 };
}

// ─── Function Router ─────────────────────────────────────

export interface RouterResult {
  selectedFunctionId: string;
  selectedFunction: KishanSathiFunction;
  resolvedLanguage: SupportedLanguage;
  expectedInputSchema: KishanSathiFunction["input_schema"];
  outputTemplate: string;
  intentConfidence: number;
}

/**
 * Main AI Router: detects language, classifies intent, and selects the
 * best matching bilingual function with appropriate template.
 */
export function routeUserMessage(
  userMessage: string,
  userLanguagePreference: SupportedLanguage | "auto" = "auto"
): RouterResult {
  // Step 1: Detect language
  const detectedLang = detectLanguage(userMessage);
  const resolvedLanguage: SupportedLanguage =
    userLanguagePreference === "auto" ? detectedLang : userLanguagePreference;

  // Step 2: Classify intent
  const { category, confidence } = classifyIntent(userMessage);

  // Step 3: Filter matching functions
  const candidates = KISHAN_SATHI_FUNCTIONS.filter(
    (f) => f.category === category && f.languages.includes(resolvedLanguage)
  );

  // Step 4: Select best function (first match within category; can be enhanced with scoring)
  const selected = candidates.length > 0
    ? candidates[0]
    : KISHAN_SATHI_FUNCTIONS.find((f) => f.id === "general_agri_qa")!;

  // Step 5: Pick language-appropriate template
  const outputTemplate = selected.output_template[resolvedLanguage] || selected.output_template.en;

  return {
    selectedFunctionId: selected.id,
    selectedFunction: selected,
    resolvedLanguage,
    expectedInputSchema: selected.input_schema,
    outputTemplate,
    intentConfidence: confidence,
  };
}
