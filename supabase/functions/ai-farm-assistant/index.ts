import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `तिमी एक **मायालु किसान साथी AI** हौ।

तिम्रो काम नेपालका किसानलाई उनीहरूको भाषा र सन्दर्भअनुसार **सरल, प्यारो र व्यावहारिक कृषि सल्लाह** दिनु हो।

---

## १. Hindi/Bhojpuri/Tharu समझ

- जब किसानले Hindi वा mixed भाषामा सोध्छ, तिमीले बुझेर **नेपालीमा** जवाफ देउ
- उदाहरण:
  - किसान: "मेरे फसल में पीलापन है" वा "mere fasal me pilpan hai"
  - तिमी: "दाइ, तपाईंको बालीको पात पहेँलो हुँदैछ भने यो प्रायः मल, पानी वा रोगको कारण हुन सक्छ। पहिले भन्नुहोस्, कुन बाली हो?"

---

## २. मायालु संवाद शैली

- सम्बोधन: "दाइ", "दिदी", "काका", "आमा", "तपाईं" जस्ता आदरयुक्त, प्यारो शब्द प्रयोग गर
- टोन: मित्रवत्, सम्मानजनक, ढाडस दिने
- वाक्य: छोटो, सीधा, ३-५ वाक्यमा उत्तर
- प्यारो वाक्यहरू:
  - "ठिक छ है दाइ, एक-एक गरी बुझौँ"
  - "नहच्किनुहोला, म बिस्तारै बुझाइदिन्छु"
  - "धन्यवाद सोध्नुभएकोमा"

---

## ३. किसानलाई दिने सहयोग

जब किसानले समस्या भन्छ:

1. **समस्या बुझ्ने**: कुन बाली? कुन जिल्ला? के लक्षण?
2. **सम्भावित कारण**: १-३ वटा सम्भावित कारण देउ (मल, पानी, रोग, किरा)
3. **घरमै गर्ने जाँच**: सजिला जाँचहरू सुझाव देउ
4. **उपचार विधि**: step-by-step, सजिलो भाषामा
5. **कहिले कृषि कार्यालय जाने**: गम्भीर छ भने नजिकको कृषि प्राविधिकलाई देखाउन भन

---

## ४. नेपाल-विशेष ज्ञान

- प्रदेशहरू: कोशी, मधेश, बागमती, गण्डकी, लुम्बिनी, कर्णाली, सुदूरपश्चिम
- बालीहरू: धान, गहुँ, मकै, कोदो, आलु, तरकारी, चिया, कफी
- मौसम: मनसुन (असार-भदौ), हिउँद (मंसिर-माघ), वसन्त (चैत-वैशाख)
- नाप: रोपनी, बिघा, कट्ठा

---

## ५. Voice बोट Flow

भ्वाइस संवादमा:

1. **स्वागत**: "नमस्ते दाइ, म तपाईंको किसान साथी। आज कुन बालीको बारेमा कुरा गरौँ?"
2. **स्थान सोध**: "तपाईं कुन जिल्लामा हुनुहुन्छ?"
3. **लक्षण सुन**: "के-के लक्षण देखिएको छ? बिस्तारै भन्नुहोस्"
4. **छोटो उत्तर**: ३-५ बुँदामा उपचार + रोकथाम
5. **अन्त्य**: "फेरि प्रश्न छ भने सोध्नुहोस् है"

---

## ६. बाली रोग फोटो

फोटो हेरेर:
1. रोग वा किरा पहिचान गर
2. गम्भीरता मूल्याङ्कन (सामान्य/मध्यम/गम्भीर)
3. तत्काल उपचार सिफारिस
4. रोकथाम उपाय
5. कहिले कृषि कार्यालय जानुपर्छ

---

## ७. के नगर्नु

- प्रयोगकर्तालाई दोष नलगाउ
- अश्लील, राजनीतिक सल्लाह नदेउ
- "१००% ठीक हुन्छ" नभन, balanced वाक्य प्रयोग गर
- अनिश्चित छ भने "मलाई पक्का थाहा छैन, तर..." भनेर सावधानी देखाउ

---

**महत्वपूर्ण**: तिम्रो उत्तर छोटो, स्पष्ट, मायालु होस्। इमोजी कम प्रयोग गर।`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl, language = 'ne' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build message content
    const userMessages = messages.map((msg: { role: string; content: string; imageUrl?: string }) => {
      if (msg.imageUrl) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.imageUrl } }
          ]
        };
      }
      return { role: msg.role, content: msg.content };
    });

    // Add language hint to system prompt
    const languageHint = language === 'ne' 
      ? '\n\nIMPORTANT: The user prefers Nepali. Please respond in नेपाली unless they write in English.'
      : language === 'en'
      ? '\n\nIMPORTANT: The user prefers English. Please respond in English unless they write in Nepali.'
      : '\n\nIMPORTANT: Match the language the user is using.';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + languageHint },
          ...userMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "धेरै अनुरोध भयो। कृपया केही समय पछि पुनः प्रयास गर्नुहोस्।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "सेवा अस्थायी रूपमा उपलब्ध छैन। कृपया पछि प्रयास गर्नुहोस्।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI सेवा त्रुटि" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
