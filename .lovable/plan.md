

# Kishan Sathi — अहिलेसम्मको कामको Summary

तपाईंले अहिलेसम्म दिनुभएका prompts र गरिएका कामहरूको संक्षिप्त सारांश:

---

## 1. Bilingual AI Function Registry & Router
- **KISHAN_SATHI_FUNCTIONS** — 12 वटा core agricultural functions (disease diagnosis, fertilizer dose, crop planning, weather, market price, general QA, call request, admin help) बनाइयो।
- हरेक function मा Nepali (`ne`) र English (`en`) दुवैमा `title`, `description`, र `output_template` छ।
- Function IDs सबै English snake_case मा standardized छन्।
- File: `src/lib/kishanSathiFunctions.ts`

## 2. AI Language Detection & Intent Router
- User को message बाट language detect गर्छ (Devanagari script / Romanized Nepali keywords)।
- Intent classify गर्छ (disease_support, fertilizer_support, weather_advice, etc.)।
- Matching function र correct language template automatically select गर्छ।
- File: `src/lib/aiRouter.ts`

## 3. Edge Function Integration
- `ai-farm-assistant` edge function मा bilingual router integrate भयो।
- AI ले user को language अनुसार system prompt र response template dynamically build गर्छ।
- Nepali लेखे Nepali मा, English लेखे English मा जवाफ आउँछ।
- File: `supabase/functions/ai-farm-assistant/index.ts`

## 4. Disease Detection — Consensus System
- `analyze-crop-disease` edge function ले 3 parallel Gemini calls गर्छ र majority voting (consensus) बाट result दिन्छ।
- Nepali + English दुवै report generate गर्छ।
- Audio script पनि auto-generate हुन्छ (TTS को लागि)।
- File: `supabase/functions/analyze-crop-disease/index.ts`

## 5. Expert Ticket Notifications (Latest)
- Farmer ले expert/technician लाई message पठाउँदा technician लाई in-app notification जान्छ।
- Technician ले reply गर्दा farmer लाई पनि notification जान्छ।
- `notifications` table मा insert हुन्छ `ticket_reply` type सँग।
- File: `src/hooks/useExpertTickets.ts`

---

## Tech Stack Used
- **Frontend:** React + TypeScript + Tailwind + Radix UI
- **Backend:** Lovable Cloud (Supabase) — Edge Functions, Database, Auth
- **AI Models:** Google Gemini 2.5 Pro (disease analysis), Gemini 2.5 Flash (report generation)
- **Architecture:** Bilingual registry pattern, consensus-based diagnosis, real-time notifications

---

## Key Design Principles
- सबै AI outputs bilingual (Nepali + English) — user को language अनुसार
- Function metadata English मा maintain, farmer-facing text दुवै भाषामा
- IPM-first approach: organic/cultural controls पहिले, chemical last
- Low-literacy friendly: short spoken summaries, numbered steps
- Consensus-based disease diagnosis for accuracy

