/**
 * Kishan Sathi – Bilingual AI Function Registry
 * 
 * Each function has BOTH Nepali (ne) and English (en) metadata.
 * IDs and categories stay in English snake_case for developer clarity.
 * 
 * Integration points:
 * - Frontend: use for UI hints (show_image_upload, etc.)
 * - Edge function (ai-farm-assistant): use for intent routing + template selection
 */

export type SupportedLanguage = "ne" | "en";

export interface BilingualText {
  ne: string;
  en: string;
}

export interface FunctionInputSchema {
  type: "object";
  properties: Record<string, { type: string; nullable?: boolean; enum?: string[] }>;
  required: string[];
}

export type FunctionCategory =
  | "disease_support"
  | "fertilizer_support"
  | "crop_planning"
  | "weather_advice"
  | "market_price"
  | "general_qa"
  | "call_request"
  | "admin_help"
  | "soil_support"
  | "irrigation_advice"
  | "livestock_support";

export interface KishanSathiFunction {
  id: string;
  category: FunctionCategory;
  languages: SupportedLanguage[];
  title: BilingualText;
  description: BilingualText;
  input_schema: FunctionInputSchema;
  output_template: BilingualText;
  ui_hint?: string[];
  /** Legacy keys from old Nepali-only system, for backward compat */
  legacy_keys?: string[];
}

export const KISHAN_SATHI_FUNCTIONS: KishanSathiFunction[] = [
  // ─── 1. Disease Support ────────────────────────────────
  {
    id: "crop_disease_expert",
    category: "disease_support",
    languages: ["ne", "en"],
    title: {
      ne: "बाली रोग विशेषज्ञ सुझाव",
      en: "Crop Disease Expert Advice",
    },
    description: {
      ne: "फोटो, खेतको स्थान र लक्षणको आधारमा सम्भावित रोग र प्रबन्धन सुझाव दिन्छ।",
      en: "Suggests possible diseases and management based on photo, location, and symptoms.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        symptoms_text: { type: "string" },
        district: { type: "string" },
        photo_url: { type: "string", nullable: true },
      },
      required: ["crop", "symptoms_text"],
    },
    output_template: {
      ne: "बाली: {{crop}}\nसम्भावित रोग: {{disease_name}}\nमुख्य लक्षण: {{key_symptoms}}\n\nप्रबन्धन:\n{{management_steps}}\n\n⚠️ सम्झनुहोस्: {{safety_reminder}}",
      en: "Crop: {{crop}}\nPossible disease: {{disease_name}}\nKey symptoms: {{key_symptoms}}\n\nManagement:\n{{management_steps}}\n\n⚠️ Remember: {{safety_reminder}}",
    },
    ui_hint: ["show_image_upload", "show_district_selector"],
    legacy_keys: ["रोग_पहिचान", "disease_check"],
  },

  // ─── 2. Fertilizer Support ─────────────────────────────
  {
    id: "fertilizer_dose_calculator",
    category: "fertilizer_support",
    languages: ["ne", "en"],
    title: {
      ne: "मल मात्रा सुझाव",
      en: "Fertilizer Dose Recommendation",
    },
    description: {
      ne: "बालीको प्रकार, जमिनको आकार र अवस्था अनुसार मल कति र कहिले हाल्ने सुझाव।",
      en: "Recommends fertilizer type, quantity, and timing based on crop, land size, and stage.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        land_size: { type: "string" },
        land_unit: { type: "string", enum: ["ropani", "bigha", "kattha", "hectare"] },
        crop_stage: { type: "string" },
        soil_type: { type: "string", nullable: true },
      },
      required: ["crop", "land_size"],
    },
    output_template: {
      ne: "बाली: {{crop}} | जमिन: {{land_size}} {{land_unit}}\n\nमल तालिका:\n{{fertilizer_schedule}}\n\n💡 सुझाव: {{tips}}",
      en: "Crop: {{crop}} | Land: {{land_size}} {{land_unit}}\n\nFertilizer schedule:\n{{fertilizer_schedule}}\n\n💡 Tips: {{tips}}",
    },
    ui_hint: ["show_land_size_input"],
    legacy_keys: ["मल_सुझाव"],
  },

  // ─── 3. Crop Planning / Sowing-Harvesting ──────────────
  {
    id: "sowing_harvesting_planner",
    category: "crop_planning",
    languages: ["ne", "en"],
    title: {
      ne: "रोपाइ / कटनी समय योजना",
      en: "Sowing & Harvesting Planner",
    },
    description: {
      ne: "तपाईंको जिल्ला र जलवायु अनुसार बाली रोप्ने र काट्ने उत्तम समय।",
      en: "Best sowing and harvesting times based on your district and climate zone.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        district: { type: "string" },
        altitude_zone: { type: "string", enum: ["terai", "hill", "mountain"], nullable: true },
      },
      required: ["crop"],
    },
    output_template: {
      ne: "बाली: {{crop}} | क्षेत्र: {{zone}}\n\nरोपाइ समय: {{sowing_window}}\nकटनी समय: {{harvest_window}}\nबिउको जात: {{recommended_varieties}}\n\n📅 याद: {{reminder}}",
      en: "Crop: {{crop}} | Zone: {{zone}}\n\nSowing window: {{sowing_window}}\nHarvest window: {{harvest_window}}\nRecommended varieties: {{recommended_varieties}}\n\n📅 Note: {{reminder}}",
    },
    ui_hint: ["show_district_selector"],
    legacy_keys: ["रोपाइ_समय"],
  },

  // ─── 4. Weather & Irrigation Advice ────────────────────
  {
    id: "weather_irrigation_advisor",
    category: "weather_advice",
    languages: ["ne", "en"],
    title: {
      ne: "मौसम र सिँचाइ सल्लाह",
      en: "Weather & Irrigation Advice",
    },
    description: {
      ne: "हालको मौसम पूर्वानुमान अनुसार सिँचाइ, छर्कने र खेत व्यवस्थापन सुझाव।",
      en: "Irrigation, spraying, and field management advice based on current weather forecast.",
    },
    input_schema: {
      type: "object",
      properties: {
        district: { type: "string" },
        crop: { type: "string", nullable: true },
        weather_data: { type: "string", nullable: true },
      },
      required: ["district"],
    },
    output_template: {
      ne: "📍 {{district}} | मौसम: {{weather_summary}}\n\nसिँचाइ: {{irrigation_advice}}\nछर्कने: {{spray_advice}}\nसावधानी: {{precaution}}",
      en: "📍 {{district}} | Weather: {{weather_summary}}\n\nIrrigation: {{irrigation_advice}}\nSpraying: {{spray_advice}}\nPrecaution: {{precaution}}",
    },
    ui_hint: ["show_district_selector"],
    legacy_keys: ["मौसम_सल्लाह"],
  },

  // ─── 5. Market Price Info ──────────────────────────────
  {
    id: "market_price_info",
    category: "market_price",
    languages: ["ne", "en"],
    title: {
      ne: "बजार मूल्य जानकारी",
      en: "Market Price Information",
    },
    description: {
      ne: "तपाईंको बालीको हालको बजार मूल्य र बेच्ने सुझाव।",
      en: "Current market prices and selling advice for your crops.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        district: { type: "string", nullable: true },
        quantity: { type: "string", nullable: true },
      },
      required: ["crop"],
    },
    output_template: {
      ne: "बाली: {{crop}}\nबजार: {{market_name}}\nमूल्य: रु. {{price_range}} प्रति {{unit}}\n\n📊 सुझाव: {{selling_advice}}",
      en: "Crop: {{crop}}\nMarket: {{market_name}}\nPrice: Rs. {{price_range}} per {{unit}}\n\n📊 Advice: {{selling_advice}}",
    },
    ui_hint: ["show_district_selector"],
    legacy_keys: ["बजार_मूल्य"],
  },

  // ─── 6. General Agricultural Q&A ───────────────────────
  {
    id: "general_agri_qa",
    category: "general_qa",
    languages: ["ne", "en"],
    title: {
      ne: "सामान्य कृषि प्रश्न",
      en: "General Agricultural Question",
    },
    description: {
      ne: "कृषिसम्बन्धी कुनै पनि सामान्य प्रश्नको जवाफ।",
      en: "Answer to any general agriculture-related question.",
    },
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string" },
        crop: { type: "string", nullable: true },
      },
      required: ["question"],
    },
    output_template: {
      ne: "{{answer}}\n\n💡 थप: {{additional_tip}}",
      en: "{{answer}}\n\n💡 Additional: {{additional_tip}}",
    },
    legacy_keys: ["सामान्य_प्रश्न"],
  },

  // ─── 7. Call Request / Expert Connect ──────────────────
  {
    id: "expert_connect_request",
    category: "call_request",
    languages: ["ne", "en"],
    title: {
      ne: "विशेषज्ञसँग कुरा गर्ने अनुरोध",
      en: "Request Expert Consultation",
    },
    description: {
      ne: "कृषि प्राविधिक वा विज्ञसँग कल/च्याट अनुरोध गर्नुहोस्।",
      en: "Request a call or chat consultation with an agricultural expert.",
    },
    input_schema: {
      type: "object",
      properties: {
        issue_summary: { type: "string" },
        crop: { type: "string", nullable: true },
        urgency: { type: "string", enum: ["normal", "urgent"] },
      },
      required: ["issue_summary"],
    },
    output_template: {
      ne: "✅ तपाईंको अनुरोध दर्ता भयो।\nसमस्या: {{issue_summary}}\nप्राथमिकता: {{urgency}}\n\nकृषि विज्ञले छिट्टै सम्पर्क गर्नेछन्।",
      en: "✅ Your request has been submitted.\nIssue: {{issue_summary}}\nPriority: {{urgency}}\n\nAn agricultural expert will contact you shortly.",
    },
    ui_hint: ["show_urgency_selector"],
    legacy_keys: ["विज्ञ_सम्पर्क"],
  },

  // ─── 8. Soil Health & Testing ──────────────────────────
  {
    id: "soil_health_advisor",
    category: "soil_support",
    languages: ["ne", "en"],
    title: {
      ne: "माटो स्वास्थ्य सल्लाह",
      en: "Soil Health Advisory",
    },
    description: {
      ne: "माटोको प्रकार, pH र पोषक तत्वको आधारमा माटो सुधार सुझाव।",
      en: "Soil improvement suggestions based on soil type, pH, and nutrient levels.",
    },
    input_schema: {
      type: "object",
      properties: {
        soil_type: { type: "string" },
        ph_level: { type: "string", nullable: true },
        crop: { type: "string", nullable: true },
        district: { type: "string", nullable: true },
      },
      required: ["soil_type"],
    },
    output_template: {
      ne: "माटोको प्रकार: {{soil_type}}\nPH: {{ph_level}}\n\nसुधार:\n{{improvement_steps}}\n\n🌱 सुझाव: {{organic_tip}}",
      en: "Soil type: {{soil_type}}\npH: {{ph_level}}\n\nImprovement:\n{{improvement_steps}}\n\n🌱 Tip: {{organic_tip}}",
    },
    legacy_keys: ["माटो_सल्लाह"],
  },

  // ─── 9. Pest Management (IPM) ─────────────────────────
  {
    id: "pest_management_ipm",
    category: "disease_support",
    languages: ["ne", "en"],
    title: {
      ne: "कीरा व्यवस्थापन (IPM)",
      en: "Pest Management (IPM)",
    },
    description: {
      ne: "एकीकृत कीरा व्यवस्थापन (IPM) सिद्धान्त अनुसार कीरा नियन्त्रण।",
      en: "Pest control following Integrated Pest Management (IPM) principles.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        pest_description: { type: "string" },
        crop_stage: { type: "string", nullable: true },
      },
      required: ["crop", "pest_description"],
    },
    output_template: {
      ne: "बाली: {{crop}} | कीरा: {{pest_name}}\n\n🛡️ IPM उपायहरू:\n1. सांस्कृतिक: {{cultural_control}}\n2. जैविक: {{biological_control}}\n3. रासायनिक (अन्तिम उपाय): {{chemical_control}}\n\n⚠️ {{safety_note}}",
      en: "Crop: {{crop}} | Pest: {{pest_name}}\n\n🛡️ IPM measures:\n1. Cultural: {{cultural_control}}\n2. Biological: {{biological_control}}\n3. Chemical (last resort): {{chemical_control}}\n\n⚠️ {{safety_note}}",
    },
    ui_hint: ["show_image_upload"],
    legacy_keys: ["कीरा_व्यवस्थापन"],
  },

  // ─── 10. Admin & Troubleshooting (Internal) ────────────
  {
    id: "admin_troubleshooting",
    category: "admin_help",
    languages: ["ne", "en"],
    title: {
      ne: "प्रशासन सहायता",
      en: "Admin & Troubleshooting Help",
    },
    description: {
      ne: "प्रणाली प्रयोग, टिकट व्यवस्थापन वा प्राविधिक समस्या सहायता।",
      en: "Help with system usage, ticket management, or technical issues.",
    },
    input_schema: {
      type: "object",
      properties: {
        issue_type: { type: "string", enum: ["app_usage", "ticket_help", "data_issue", "other"] },
        description: { type: "string" },
      },
      required: ["description"],
    },
    output_template: {
      ne: "समस्या: {{issue_type}}\n\nसमाधान:\n{{resolution_steps}}\n\nथप सहयोगको लागि प्रशासकसँग सम्पर्क गर्नुहोस्।",
      en: "Issue: {{issue_type}}\n\nResolution:\n{{resolution_steps}}\n\nContact admin for further assistance.",
    },
    legacy_keys: ["प्रशासन_सहायता"],
  },

  // ─── 11. Crop Recommendation ───────────────────────────
  {
    id: "crop_recommendation",
    category: "crop_planning",
    languages: ["ne", "en"],
    title: {
      ne: "बाली सिफारिस",
      en: "Crop Recommendation",
    },
    description: {
      ne: "तपाईंको जमिन, मौसम र बजार अवसर अनुसार उत्तम बाली छनोट।",
      en: "Best crop selection based on your land, season, and market opportunities.",
    },
    input_schema: {
      type: "object",
      properties: {
        district: { type: "string" },
        land_size: { type: "string", nullable: true },
        season: { type: "string", nullable: true },
        soil_type: { type: "string", nullable: true },
        budget: { type: "string", enum: ["low", "medium", "high"], nullable: true },
      },
      required: ["district"],
    },
    output_template: {
      ne: "📍 {{district}} | मौसम: {{season}}\n\nसिफारिस बालीहरू:\n{{crop_list}}\n\n💰 अनुमानित आम्दानी: {{income_estimate}}\n📌 {{note}}",
      en: "📍 {{district}} | Season: {{season}}\n\nRecommended crops:\n{{crop_list}}\n\n💰 Estimated income: {{income_estimate}}\n📌 {{note}}",
    },
    ui_hint: ["show_district_selector"],
    legacy_keys: ["बाली_सिफारिस"],
  },

  // ─── 12. Post-Harvest & Storage ────────────────────────
  {
    id: "post_harvest_storage",
    category: "general_qa",
    languages: ["ne", "en"],
    title: {
      ne: "कटनी पछिको भण्डारण",
      en: "Post-Harvest Storage Guide",
    },
    description: {
      ne: "बालीको गुणस्तर कायम राख्न भण्डारण र प्रशोधन सुझाव।",
      en: "Storage and processing tips to maintain crop quality after harvest.",
    },
    input_schema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        quantity: { type: "string", nullable: true },
        storage_type: { type: "string", nullable: true },
      },
      required: ["crop"],
    },
    output_template: {
      ne: "बाली: {{crop}}\n\n📦 भण्डारण विधि:\n{{storage_method}}\n\n🔍 ध्यान दिनुपर्ने:\n{{precautions}}\n\n💡 {{tip}}",
      en: "Crop: {{crop}}\n\n📦 Storage method:\n{{storage_method}}\n\n🔍 Things to watch:\n{{precautions}}\n\n💡 {{tip}}",
    },
    legacy_keys: ["भण्डारण_सुझाव"],
  },
];

/**
 * Lookup a function by its legacy Nepali key (backward compat)
 */
export function findByLegacyKey(key: string): KishanSathiFunction | undefined {
  return KISHAN_SATHI_FUNCTIONS.find(f => f.legacy_keys?.includes(key));
}

/**
 * Get functions by category
 */
export function getFunctionsByCategory(category: FunctionCategory): KishanSathiFunction[] {
  return KISHAN_SATHI_FUNCTIONS.filter(f => f.category === category);
}

/**
 * Get localized title for a function
 */
export function getLocalizedTitle(func: KishanSathiFunction, lang: SupportedLanguage): string {
  return func.title[lang] || func.title.en;
}
