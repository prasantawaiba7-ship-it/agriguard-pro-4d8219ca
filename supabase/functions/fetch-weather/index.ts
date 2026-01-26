import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Open-Meteo API - free weather API, no key required
const OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

// Weather code mappings (English and Nepali)
const weatherDescriptions: Record<number, { code: string; en: string; ne: string }> = {
  0: { code: "clear", en: "Clear sky", ne: "खुला आकाश" },
  1: { code: "mainly_clear", en: "Mainly clear", ne: "प्रायः खुला" },
  2: { code: "partly_cloudy", en: "Partly cloudy", ne: "आंशिक बादल" },
  3: { code: "overcast", en: "Overcast", ne: "बादलले ढाकेको" },
  45: { code: "foggy", en: "Foggy", ne: "कुहिरो" },
  48: { code: "rime_fog", en: "Rime fog", ne: "तुषार कुहिरो" },
  51: { code: "light_drizzle", en: "Light drizzle", ne: "हल्का झरी" },
  53: { code: "moderate_drizzle", en: "Moderate drizzle", ne: "मध्यम झरी" },
  55: { code: "dense_drizzle", en: "Dense drizzle", ne: "घना झरी" },
  61: { code: "slight_rain", en: "Slight rain", ne: "हल्का वर्षा" },
  63: { code: "moderate_rain", en: "Moderate rain", ne: "मध्यम वर्षा" },
  65: { code: "heavy_rain", en: "Heavy rain", ne: "भारी वर्षा" },
  71: { code: "slight_snow", en: "Slight snow", ne: "हल्का हिउँ" },
  73: { code: "moderate_snow", en: "Moderate snow", ne: "मध्यम हिउँ" },
  75: { code: "heavy_snow", en: "Heavy snow", ne: "भारी हिउँ" },
  80: { code: "slight_showers", en: "Slight rain showers", ne: "हल्का वर्षाको झरी" },
  81: { code: "moderate_showers", en: "Moderate rain showers", ne: "मध्यम वर्षाको झरी" },
  82: { code: "violent_showers", en: "Violent rain showers", ne: "तीव्र वर्षाको झरी" },
  95: { code: "thunderstorm", en: "Thunderstorm", ne: "चट्याङ सहित आँधी" },
  96: { code: "thunderstorm_hail", en: "Thunderstorm with slight hail", ne: "असिना सहित आँधी" },
  99: { code: "severe_thunderstorm", en: "Thunderstorm with heavy hail", ne: "भारी असिना सहित आँधी" }
};

// Nepal district coordinates (for district-based queries)
const nepalDistricts: Record<string, { lat: number; lng: number; name_ne: string }> = {
  "Kathmandu": { lat: 27.7172, lng: 85.324, name_ne: "काठमाडौं" },
  "Lalitpur": { lat: 27.6588, lng: 85.3247, name_ne: "ललितपुर" },
  "Bhaktapur": { lat: 27.6712, lng: 85.4298, name_ne: "भक्तपुर" },
  "Chitwan": { lat: 27.5291, lng: 84.3542, name_ne: "चितवन" },
  "Pokhara": { lat: 28.2096, lng: 83.9856, name_ne: "पोखरा" },
  "Lamjung": { lat: 28.2833, lng: 84.4167, name_ne: "लमजुङ" },
  "Jhapa": { lat: 26.6333, lng: 87.8833, name_ne: "झापा" },
  "Morang": { lat: 26.65, lng: 87.4667, name_ne: "मोरङ" },
  "Sunsari": { lat: 26.6667, lng: 87.1667, name_ne: "सुनसरी" },
  "Kaski": { lat: 28.3, lng: 84.0, name_ne: "कास्की" },
  "Rupandehi": { lat: 27.5, lng: 83.4167, name_ne: "रुपन्देही" },
  "Bara": { lat: 27.0667, lng: 85.05, name_ne: "बारा" },
  "Parsa": { lat: 27.15, lng: 84.9667, name_ne: "पर्सा" },
  "Makwanpur": { lat: 27.4167, lng: 85.0333, name_ne: "मकवानपुर" },
  "Dhading": { lat: 27.8667, lng: 84.9167, name_ne: "धादिङ" },
  "Nuwakot": { lat: 27.9167, lng: 85.1667, name_ne: "नुवाकोट" },
  "Sindhupalchok": { lat: 27.95, lng: 85.6833, name_ne: "सिन्धुपाल्चोक" },
  "Dolakha": { lat: 27.8, lng: 86.0667, name_ne: "दोलखा" },
  "Ramechhap": { lat: 27.3333, lng: 86.0833, name_ne: "रामेछाप" },
  "Kavrepalanchok": { lat: 27.5333, lng: 85.5333, name_ne: "काभ्रेपलाञ्चोक" }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { latitude, longitude, district, days = 7, language = "en" } = body;

    // If district is provided, resolve to coordinates
    if (district && nepalDistricts[district]) {
      latitude = nepalDistricts[district].lat;
      longitude = nepalDistricts[district].lng;
    }

    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required (or provide a valid Nepal district name)");
    }

    console.log(`[FETCH-WEATHER] Fetching for: ${latitude}, ${longitude}${district ? ` (${district})` : ''}`);

    const url = new URL(OPEN_METEO_API);
    url.searchParams.set("latitude", latitude.toString());
    url.searchParams.set("longitude", longitude.toString());
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code");
    url.searchParams.set("hourly", "temperature_2m,precipitation,precipitation_probability,wind_speed_10m,relative_humidity_2m");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunshine_duration");
    url.searchParams.set("forecast_days", Math.min(days, 16).toString());
    url.searchParams.set("timezone", "Asia/Kathmandu");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Failed to fetch weather data from Open-Meteo");
    }

    const data = await response.json();

    // Location info
    const location = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      name: district 
        ? (language === "ne" ? nepalDistricts[district]?.name_ne : district)
        : `${parseFloat(latitude).toFixed(2)}°N, ${parseFloat(longitude).toFixed(2)}°E`
    };

    // Format current weather (unified schema)
    const weatherInfo = weatherDescriptions[data.current?.weather_code] || { code: "unknown", en: "Unknown", ne: "अज्ञात" };
    const current = {
      timestamp: new Date().toISOString(),
      temperature_c: data.current?.temperature_2m ?? null,
      humidity_percent: data.current?.relative_humidity_2m ?? null,
      wind_speed_kmh: data.current?.wind_speed_10m ?? null,
      wind_direction_deg: data.current?.wind_direction_10m ?? null,
      rain_mm_last_1h: data.current?.precipitation ?? 0,
      conditions_code: weatherInfo.code,
      conditions_text: language === "ne" ? weatherInfo.ne : weatherInfo.en
    };

    // Format hourly forecast (next 48 hours)
    const hourly: any[] = [];
    if (data.hourly) {
      const hoursToInclude = Math.min(48, data.hourly.time.length);
      for (let i = 0; i < hoursToInclude; i++) {
        hourly.push({
          timestamp: data.hourly.time[i],
          temperature_c: data.hourly.temperature_2m[i],
          rain_mm: data.hourly.precipitation?.[i] ?? 0,
          rain_probability_percent: data.hourly.precipitation_probability?.[i] ?? 0,
          wind_speed_kmh: data.hourly.wind_speed_10m?.[i] ?? 0,
          humidity_percent: data.hourly.relative_humidity_2m?.[i] ?? null
        });
      }
    }

    // Format daily forecast (unified schema)
    const daily: any[] = [];
    if (data.daily) {
      for (let i = 0; i < data.daily.time.length; i++) {
        daily.push({
          date: data.daily.time[i],
          temp_min_c: data.daily.temperature_2m_min[i],
          temp_max_c: data.daily.temperature_2m_max[i],
          rain_mm: data.daily.precipitation_sum[i] ?? 0,
          rain_probability_percent: data.daily.precipitation_probability_max[i] ?? 0,
          wind_speed_kmh_max: data.daily.wind_speed_10m_max[i] ?? 0,
          sun_hours: data.daily.sunshine_duration?.[i] ? (data.daily.sunshine_duration[i] / 3600).toFixed(1) : null
        });
      }
    }

    // Calculate farming summary metrics
    const avgTemp = daily.length > 0 
      ? daily.reduce((sum, day) => sum + (day.temp_max_c + day.temp_min_c) / 2, 0) / daily.length 
      : null;
    const totalRainfall = daily.reduce((sum, day) => sum + (day.rain_mm || 0), 0);
    const rainyDays = daily.filter(day => (day.rain_mm || 0) > 1).length;

    // Farming advisory based on weather (bilingual)
    const farmingAdvisory: string[] = [];
    const tomorrow = daily[1];

    if (tomorrow) {
      if (tomorrow.rain_mm >= 25 || tomorrow.rain_probability_percent >= 80) {
        farmingAdvisory.push(language === "ne" 
          ? "⚠️ भोलि भारी वर्षा सम्भावना। नाली सफा गर्नुहोस् र बीउ/मल सुरक्षित राख्नुस्।"
          : "⚠️ Heavy rain expected tomorrow. Clear drains and protect seeds/fertilizers."
        );
      }

      if (tomorrow.temp_max_c >= 35) {
        farmingAdvisory.push(language === "ne"
          ? "🌡️ उच्च तापक्रम सम्भावना। बिहान सिँचाइ गर्नुहोस् र मल्चिङ गर्नुहोस्।"
          : "🌡️ High temperature expected. Irrigate in morning and consider mulching."
        );
      }

      if (tomorrow.rain_probability_percent < 20 && tomorrow.wind_speed_kmh_max < 10) {
        farmingAdvisory.push(language === "ne"
          ? "✅ भोलि औषधि छर्न उपयुक्त समय - कम पानी र कम हावा।"
          : "✅ Good conditions for spraying tomorrow - low rain and wind."
        );
      }
    }

    if (totalRainfall > 100) {
      farmingAdvisory.push(language === "ne"
        ? "💧 धेरै वर्षा अपेक्षित। सिँचाइ नगर्नुहोस् र उचित निकास सुनिश्चित गर्नुहोस्।"
        : "💧 Heavy rainfall expected this week. Avoid irrigation and ensure proper drainage."
      );
    } else if (totalRainfall < 5 && daily.length >= 5) {
      farmingAdvisory.push(language === "ne"
        ? "🏜️ कम वर्षा अपेक्षित। पूरक सिँचाइको योजना बनाउनुहोस्।"
        : "🏜️ Low rainfall expected. Plan for supplemental irrigation."
      );
    }

    // Unified response schema
    return new Response(JSON.stringify({
      location,
      current,
      hourly,
      daily,
      summary: {
        average_temperature_c: avgTemp ? parseFloat(avgTemp.toFixed(1)) : null,
        total_expected_rainfall_mm: parseFloat(totalRainfall.toFixed(1)),
        rainy_days: rainyDays
      },
      farming_advisory: farmingAdvisory,
      fetched_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[FETCH-WEATHER] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
