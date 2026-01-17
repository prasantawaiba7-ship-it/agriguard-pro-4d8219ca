import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Outbreak threshold - number of similar detections needed to trigger alert
const OUTBREAK_THRESHOLD = 3;
const OUTBREAK_WINDOW_HOURS = 72; // 3 days

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { diseaseDetection } = await req.json();
    
    if (!diseaseDetection) {
      return new Response(
        JSON.stringify({ error: "Disease detection data required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { detected_disease, farmer_id, severity } = diseaseDetection;

    // Get farmer's location
    const { data: farmerProfile } = await supabase
      .from("farmer_profiles")
      .select("district, state")
      .eq("id", farmer_id)
      .single();

    if (!farmerProfile?.district || !farmerProfile?.state) {
      return new Response(
        JSON.stringify({ message: "Farmer location not set, skipping outbreak check" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { district, state } = farmerProfile;

    // Check for similar detections in the area within the outbreak window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - OUTBREAK_WINDOW_HOURS);

    // Get all farmer IDs in the same district
    const { data: localFarmers } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("district", district)
      .eq("state", state);

    const farmerIds = localFarmers?.map(f => f.id) || [];

    if (farmerIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No local farmers found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count similar disease detections in the area
    const { data: recentDetections, error: countError } = await supabase
      .from("disease_detections")
      .select("id, farmer_id, detected_disease")
      .in("farmer_id", farmerIds)
      .ilike("detected_disease", `%${detected_disease}%`)
      .gte("analyzed_at", windowStart.toISOString());

    if (countError) {
      console.error("Error counting detections:", countError);
      throw countError;
    }

    const detectionCount = recentDetections?.length || 0;
    const uniqueFarmers = new Set(recentDetections?.map(d => d.farmer_id) || []);

    console.log(`Outbreak check: ${detected_disease} in ${district}, ${state}`);
    console.log(`Found ${detectionCount} detections from ${uniqueFarmers.size} farmers`);

    // Check if this triggers an outbreak alert
    if (uniqueFarmers.size >= OUTBREAK_THRESHOLD) {
      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from("disease_outbreak_alerts")
        .select("id, detection_count")
        .eq("district", district)
        .eq("state", state)
        .ilike("disease_name", `%${detected_disease}%`)
        .eq("is_active", true)
        .single();

      if (existingAlert) {
        // Update existing alert
        await supabase
          .from("disease_outbreak_alerts")
          .update({
            detection_count: uniqueFarmers.size,
            last_detected_at: new Date().toISOString(),
            severity: severity || "medium",
          })
          .eq("id", existingAlert.id);

        console.log(`Updated outbreak alert: ${existingAlert.id}`);
      } else {
        // Create new outbreak alert
        const { data: newAlert, error: alertError } = await supabase
          .from("disease_outbreak_alerts")
          .insert({
            district,
            state,
            disease_name: detected_disease,
            detection_count: uniqueFarmers.size,
            severity: severity || "medium",
            affected_crops: [],
          })
          .select()
          .single();

        if (alertError) {
          console.error("Error creating alert:", alertError);
          throw alertError;
        }

        console.log(`Created new outbreak alert: ${newAlert.id}`);

        // Create notifications for all farmers in the area
        const notifications = farmerIds
          .filter(id => id !== farmer_id) // Don't notify the reporting farmer
          .map(farmerId => ({
            farmer_id: farmerId,
            type: "outbreak_alert",
            title: `⚠️ रोग प्रकोप चेतावनी: ${detected_disease}`,
            message: `तपाईंको क्षेत्र ${district} मा ${uniqueFarmers.size} किसानले ${detected_disease} रोग रिपोर्ट गरेका छन्। सावधान रहनुहोस्।`,
            data: {
              alert_id: newAlert.id,
              disease: detected_disease,
              detection_count: uniqueFarmers.size,
            },
          }));

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from("farmer_notifications")
            .insert(notifications);

          if (notifError) {
            console.error("Error creating notifications:", notifError);
          } else {
            console.log(`Created ${notifications.length} notifications`);
          }
        }
      }

      return new Response(
        JSON.stringify({
          outbreak_detected: true,
          detection_count: uniqueFarmers.size,
          district,
          disease: detected_disease,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        outbreak_detected: false,
        detection_count: uniqueFarmers.size,
        threshold: OUTBREAK_THRESHOLD,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Outbreak check error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
