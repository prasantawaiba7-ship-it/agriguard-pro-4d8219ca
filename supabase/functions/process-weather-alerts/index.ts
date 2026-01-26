import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEATHER-ALERTS] ${step}${detailsStr}`);
};

// Open-Meteo API
const OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

// Alert thresholds
const THRESHOLDS = {
  HEAVY_RAIN_MM: 25,
  HEAVY_RAIN_PROBABILITY: 80,
  HEAT_STRESS_C: 35,
  COLD_STRESS_C: 5,
  SPRAY_MAX_RAIN_PROBABILITY: 20,
  SPRAY_MAX_WIND_KMH: 8,
};

interface WeatherData {
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    temperature_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
}

async function fetchWeatherForLocation(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url = new URL(OPEN_METEO_API);
    url.searchParams.set("latitude", lat.toString());
    url.searchParams.set("longitude", lng.toString());
    url.searchParams.set("hourly", "temperature_2m,precipitation,precipitation_probability,wind_speed_10m");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max");
    url.searchParams.set("forecast_days", "3");
    url.searchParams.set("timezone", "Asia/Kathmandu");

    const response = await fetch(url.toString());
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    logStep("Weather fetch error", { error: String(error) });
    return null;
  }
}

interface AlertToCreate {
  farmer_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

function generateAlerts(
  farmerId: string,
  weather: WeatherData,
  prefs: { weather_alerts: boolean; outbreak_alerts: boolean },
  language: string
): AlertToCreate[] {
  const alerts: AlertToCreate[] = [];
  
  if (!prefs.weather_alerts) return alerts;

  const tomorrow = weather.daily;
  const tomorrowIdx = 1; // Index 1 is tomorrow

  if (tomorrow.time.length < 2) return alerts;

  const tomorrowRain = tomorrow.precipitation_sum[tomorrowIdx] || 0;
  const tomorrowRainProb = tomorrow.precipitation_probability_max[tomorrowIdx] || 0;
  const tomorrowTempMax = tomorrow.temperature_2m_max[tomorrowIdx] || 0;
  const tomorrowTempMin = tomorrow.temperature_2m_min[tomorrowIdx] || 0;
  const tomorrowWind = tomorrow.wind_speed_10m_max[tomorrowIdx] || 0;

  // Heavy rain alert
  if (tomorrowRain >= THRESHOLDS.HEAVY_RAIN_MM || tomorrowRainProb >= THRESHOLDS.HEAVY_RAIN_PROBABILITY) {
    alerts.push({
      farmer_id: farmerId,
      type: "heavy_rain",
      title: language === "ne" ? "भोलि भारी वर्षा सम्भावना" : "Heavy Rain Expected Tomorrow",
      message: language === "ne"
        ? `भोलि ${tomorrowRain.toFixed(0)}mm वर्षा हुन सक्छ (${tomorrowRainProb}% सम्भावना)। नाली सफा गर्नुहोस् र बीउ/मल सुरक्षित राख्नुस्।`
        : `${tomorrowRain.toFixed(0)}mm rain expected tomorrow (${tomorrowRainProb}% probability). Clear drains and protect seeds/fertilizers.`,
      data: { rain_mm: tomorrowRain, probability: tomorrowRainProb }
    });
  }

  // Heat stress alert
  if (tomorrowTempMax >= THRESHOLDS.HEAT_STRESS_C) {
    alerts.push({
      farmer_id: farmerId,
      type: "heat_stress",
      title: language === "ne" ? "उच्च तापक्रमको चेतावनी" : "High Temperature Warning",
      message: language === "ne"
        ? `भोलि तापक्रम ${tomorrowTempMax.toFixed(0)}°C सम्म पुग्न सक्छ। बिहान सिँचाइ गर्नुहोस् र दिउँसो मल/स्प्रे नगर्नुहोस्।`
        : `Temperature may reach ${tomorrowTempMax.toFixed(0)}°C tomorrow. Irrigate in morning and avoid midday spraying.`,
      data: { temp_max: tomorrowTempMax }
    });
  }

  // Cold stress alert
  if (tomorrowTempMin <= THRESHOLDS.COLD_STRESS_C) {
    alerts.push({
      farmer_id: farmerId,
      type: "cold_stress",
      title: language === "ne" ? "चिसो तापक्रमको चेतावनी" : "Low Temperature Warning",
      message: language === "ne"
        ? `भोलि तापक्रम ${tomorrowTempMin.toFixed(0)}°C सम्म झर्न सक्छ। बाली जोगाउने उपाय गर्नुहोस्।`
        : `Temperature may drop to ${tomorrowTempMin.toFixed(0)}°C tomorrow. Protect sensitive crops.`,
      data: { temp_min: tomorrowTempMin }
    });
  }

  // Spray window alert - check if good conditions in next 24 hours
  if (tomorrowRainProb < THRESHOLDS.SPRAY_MAX_RAIN_PROBABILITY && tomorrowWind < THRESHOLDS.SPRAY_MAX_WIND_KMH) {
    // Find a good window in hourly data
    const hourlyStart = 24; // Start from tomorrow's hours
    const hourlyEnd = Math.min(48, weather.hourly.time.length);
    
    let goodHoursCount = 0;
    for (let i = hourlyStart; i < hourlyEnd; i++) {
      const rainProb = weather.hourly.precipitation_probability[i] || 0;
      const wind = weather.hourly.wind_speed_10m[i] || 0;
      if (rainProb < THRESHOLDS.SPRAY_MAX_RAIN_PROBABILITY && wind < THRESHOLDS.SPRAY_MAX_WIND_KMH) {
        goodHoursCount++;
      }
    }

    // If at least 6 consecutive good hours
    if (goodHoursCount >= 6) {
      alerts.push({
        farmer_id: farmerId,
        type: "spray_window",
        title: language === "ne" ? "भोलि औषधि छर्न उपयुक्त समय" : "Good Spraying Conditions Tomorrow",
        message: language === "ne"
          ? `भोलि कम पानी (${tomorrowRainProb}% सम्भावना) र कम हावा (${tomorrowWind.toFixed(0)} km/h) देखिन्छ। रोग/कीरा औषधि छर्न राम्रो समय हो।`
          : `Low rain chance (${tomorrowRainProb}%) and light winds (${tomorrowWind.toFixed(0)} km/h) tomorrow. Good time for pesticide application.`,
        data: { rain_probability: tomorrowRainProb, wind_kmh: tomorrowWind }
      });
    }
  }

  return alerts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Optional: Initialize Resend for email alerts
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  try {
    logStep("Function started");

    // Get all farmers with their preferences and location
    const { data: farmers, error: farmersError } = await supabaseClient
      .from('farmer_profiles')
      .select(`
        id,
        user_id,
        full_name,
        district,
        state,
        preferred_language,
        farmer_notification_preferences (
          weather_alerts,
          outbreak_alerts,
          push_enabled,
          email_enabled,
          push_subscription
        )
      `);

    if (farmersError) {
      throw new Error(`Failed to fetch farmers: ${farmersError.message}`);
    }

    logStep("Farmers fetched", { count: farmers?.length || 0 });

    // Get user emails for email notifications
    const userIds = farmers?.map(f => f.user_id) || [];
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
    const userEmailMap: Record<string, string> = {};
    authUsers?.users?.forEach(u => {
      if (u.email) userEmailMap[u.id] = u.email;
    });

    // Nepal district coordinates
    const districtCoords: Record<string, { lat: number; lng: number }> = {
      "Kathmandu": { lat: 27.7172, lng: 85.324 },
      "Lalitpur": { lat: 27.6588, lng: 85.3247 },
      "Bhaktapur": { lat: 27.6712, lng: 85.4298 },
      "Chitwan": { lat: 27.5291, lng: 84.3542 },
      "Pokhara": { lat: 28.2096, lng: 83.9856 },
      "Lamjung": { lat: 28.2833, lng: 84.4167 },
      "Jhapa": { lat: 26.6333, lng: 87.8833 },
      "Morang": { lat: 26.65, lng: 87.4667 },
      "Sunsari": { lat: 26.6667, lng: 87.1667 },
      "Kaski": { lat: 28.3, lng: 84.0 },
      "Rupandehi": { lat: 27.5, lng: 83.4167 },
      "Makwanpur": { lat: 27.4167, lng: 85.0333 }
    };

    // Default location (Kathmandu) for farmers without district
    const defaultLocation = { lat: 27.7172, lng: 85.324 };

    let alertsCreated = 0;
    let emailsSent = 0;

    // Process each farmer
    for (const farmer of farmers || []) {
      const prefs = farmer.farmer_notification_preferences?.[0] || {
        weather_alerts: true,
        outbreak_alerts: true,
        push_enabled: true,
        email_enabled: false
      };

      // Get location
      const location = districtCoords[farmer.district || ""] || defaultLocation;
      const language = farmer.preferred_language || "en";

      // Fetch weather for this location
      const weather = await fetchWeatherForLocation(location.lat, location.lng);
      if (!weather) {
        logStep("Weather fetch failed for farmer", { farmerId: farmer.id });
        continue;
      }

      // Generate alerts based on weather data
      const alerts = generateAlerts(farmer.id, weather, prefs, language);

      if (alerts.length === 0) continue;

      logStep("Alerts generated for farmer", { farmerId: farmer.id, count: alerts.length });

      // Insert notifications
      for (const alert of alerts) {
        // Check if similar alert already sent today
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabaseClient
          .from('farmer_notifications')
          .select('id')
          .eq('farmer_id', alert.farmer_id)
          .eq('type', alert.type)
          .gte('created_at', `${today}T00:00:00Z`)
          .maybeSingle();

        if (existing) {
          logStep("Alert already sent today", { type: alert.type, farmerId: farmer.id });
          continue;
        }

        // Insert notification
        const { error: insertError } = await supabaseClient
          .from('farmer_notifications')
          .insert({
            farmer_id: alert.farmer_id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            data: alert.data || {},
            read: false
          });

        if (!insertError) {
          alertsCreated++;

          // Send email if enabled
          if (prefs.email_enabled && resend) {
            const userEmail = userEmailMap[farmer.user_id];
            if (userEmail) {
              try {
                await resend.emails.send({
                  from: "Krishi Mitra <alerts@resend.dev>",
                  to: [userEmail],
                  subject: alert.title,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                      <h2 style="color: #16a34a;">${alert.title}</h2>
                      <p style="font-size: 16px; color: #374151;">${alert.message}</p>
                      <hr style="margin: 20px 0; border-color: #e5e7eb;" />
                      <p style="font-size: 12px; color: #9ca3af;">
                        ${language === "ne" ? "कृषि मित्र बाट" : "From Krishi Mitra"}
                      </p>
                    </div>
                  `
                });
                emailsSent++;
                logStep("Email sent", { email: userEmail, type: alert.type });
              } catch (emailError) {
                logStep("Email send failed", { error: String(emailError) });
              }
            }
          }
        }
      }
    }

    logStep("Processing complete", { alertsCreated, emailsSent });

    return new Response(JSON.stringify({
      success: true,
      alerts_created: alertsCreated,
      emails_sent: emailsSent,
      processed_farmers: farmers?.length || 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
