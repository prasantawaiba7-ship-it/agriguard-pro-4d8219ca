import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  appointment_id: string;
  notification_type: "confirmation" | "reminder" | "cancellation";
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointment_id, notification_type }: NotificationRequest = await req.json();
    console.log(`Processing ${notification_type} notification for appointment: ${appointment_id}`);

    // Fetch appointment details with related data
    const { data: appointment, error: fetchError } = await supabase
      .from("officer_appointments")
      .select(`
        *,
        farmer_profiles!officer_appointments_farmer_id_fkey (
          full_name,
          phone,
          user_id
        ),
        agricultural_officers!officer_appointments_officer_id_fkey (
          name,
          name_ne,
          phone,
          email,
          district,
          office_name_ne
        )
      `)
      .eq("id", appointment_id)
      .single();

    if (fetchError || !appointment) {
      console.error("Failed to fetch appointment:", fetchError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Appointment data:", JSON.stringify(appointment, null, 2));

    const farmer = appointment.farmer_profiles;
    const officer = appointment.agricultural_officers;
    
    // Get farmer's email from auth
    let farmerEmail: string | null = null;
    if (farmer?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(farmer.user_id);
      farmerEmail = authUser?.user?.email || null;
    }

    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('ne-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Send email to farmer if email available
    if (farmerEmail) {
      try {
        const farmerSubject = notification_type === "confirmation" 
          ? `✅ भेटघाट पुष्टि - ${appointmentDate}`
          : notification_type === "cancellation"
          ? `❌ भेटघाट रद्द - ${appointmentDate}`
          : `🔔 भेटघाट सम्झना - ${appointmentDate}`;

        const farmerHtml = generateFarmerEmail(
          notification_type,
          farmer.full_name,
          officer.name_ne || officer.name,
          officer.district,
          appointmentDate,
          appointment.appointment_time,
          appointment.purpose,
          officer.phone,
          officer.office_name_ne
        );

        const farmerEmailResult = await resend.emails.send({
          from: "CROPIC Nepal <onboarding@resend.dev>",
          to: [farmerEmail],
          subject: farmerSubject,
          html: farmerHtml,
        });

        console.log("Farmer email sent:", farmerEmailResult);
        emailsSent.push(`farmer: ${farmerEmail}`);
      } catch (emailError: any) {
        console.error("Failed to send farmer email:", emailError);
        errors.push(`farmer email: ${emailError.message}`);
      }
    }

    // Send email to officer if email available
    if (officer?.email) {
      try {
        const officerSubject = notification_type === "confirmation"
          ? `📅 नयाँ भेटघाट अनुरोध - ${farmer.full_name}`
          : notification_type === "cancellation"
          ? `❌ भेटघाट रद्द - ${farmer.full_name}`
          : `🔔 भेटघाट सम्झना - ${farmer.full_name}`;

        const officerHtml = generateOfficerEmail(
          notification_type,
          officer.name_ne || officer.name,
          farmer.full_name,
          appointmentDate,
          appointment.appointment_time,
          appointment.purpose,
          appointment.farmer_phone || farmer.phone,
          appointment.notes
        );

        const officerEmailResult = await resend.emails.send({
          from: "CROPIC Nepal <onboarding@resend.dev>",
          to: [officer.email],
          subject: officerSubject,
          html: officerHtml,
        });

        console.log("Officer email sent:", officerEmailResult);
        emailsSent.push(`officer: ${officer.email}`);
      } catch (emailError: any) {
        console.error("Failed to send officer email:", emailError);
        errors.push(`officer email: ${emailError.message}`);
      }
    }

    // Log notification activity
    await supabase.from("activity_logs").insert({
      action: `appointment_${notification_type}_sent`,
      entity_type: "officer_appointments",
      entity_id: appointment_id,
      details: {
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        farmer_name: farmer?.full_name,
        officer_name: officer?.name_ne
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateFarmerEmail(
  type: string,
  farmerName: string,
  officerName: string,
  district: string,
  date: string,
  time: string,
  purpose: string,
  officerPhone: string | null,
  officeName: string | null
): string {
  const purposeLabels: Record<string, string> = {
    crop_advice: 'बाली सल्लाह',
    disease_consultation: 'रोग परामर्श',
    soil_testing: 'माटो परीक्षण',
    pest_control: 'कीट नियन्त्रण',
    seed_selection: 'बीउ छनोट',
    irrigation: 'सिंचाइ सल्लाह',
    fertilizer: 'मल प्रयोग',
    market_linkage: 'बजार जोडान',
    other: 'अन्य'
  };

  if (type === "confirmation") {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
        .btn { display: inline-block; background: #22c55e; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ भेटघाट पुष्टि भयो!</h1>
        </div>
        <div class="content">
          <p>नमस्ते <strong>${farmerName}</strong> जी,</p>
          <p>तपाईंको कृषि प्राविधिकसँगको भेटघाट अनुरोध प्राप्त भएको छ।</p>
          
          <div class="info-box">
            <p>👨‍🌾 <strong>कृषि प्राविधिक:</strong> ${officerName}</p>
            <p>📍 <strong>जिल्ला:</strong> ${district}</p>
            ${officeName ? `<p>🏢 <strong>कार्यालय:</strong> ${officeName}</p>` : ''}
            <p>📅 <strong>मिति:</strong> ${date}</p>
            <p>🕐 <strong>समय:</strong> ${time}</p>
            <p>📋 <strong>उद्देश्य:</strong> ${purposeLabels[purpose] || purpose}</p>
            ${officerPhone ? `<p>📞 <strong>सम्पर्क:</strong> ${officerPhone}</p>` : ''}
          </div>
          
          <p>⚠️ <strong>कृपया समयमा पुग्नुहोस्।</strong></p>
          <p>यदि तपाईंले भेटघाट रद्द गर्नुपर्ने भएमा, कृपया पहिलेनै सूचना दिनुहोस्।</p>
        </div>
        <div class="footer">
          <p>🌾 CROPIC Nepal - तपाईंको कृषि साथी</p>
          <p>यो स्वचालित इमेल हो। कृपया जवाफ नदिनुहोस्।</p>
        </div>
      </div>
    </body>
    </html>
    `;
  } else if (type === "cancellation") {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ भेटघाट रद्द भयो</h1>
        </div>
        <div class="content">
          <p>नमस्ते <strong>${farmerName}</strong> जी,</p>
          <p>तपाईंको निम्न भेटघाट रद्द गरिएको छ:</p>
          
          <div class="info-box">
            <p>👨‍🌾 <strong>कृषि प्राविधिक:</strong> ${officerName}</p>
            <p>📅 <strong>मिति:</strong> ${date}</p>
            <p>🕐 <strong>समय:</strong> ${time}</p>
          </div>
          
          <p>तपाईं नयाँ भेटघाट तय गर्न सक्नुहुन्छ।</p>
        </div>
        <div class="footer">
          <p>🌾 CROPIC Nepal - तपाईंको कृषि साथी</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
  
  // Reminder
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔔 भेटघाट सम्झना</h1>
      </div>
      <div class="content">
        <p>नमस्ते <strong>${farmerName}</strong> जी,</p>
        <p>तपाईंको भेटघाट भोलि तोकिएको छ:</p>
        
        <div class="info-box">
          <p>👨‍🌾 <strong>कृषि प्राविधिक:</strong> ${officerName}</p>
          <p>📍 <strong>जिल्ला:</strong> ${district}</p>
          <p>📅 <strong>मिति:</strong> ${date}</p>
          <p>🕐 <strong>समय:</strong> ${time}</p>
        </div>
        
        <p>⚠️ <strong>कृपया समयमा पुग्नुहोस्।</strong></p>
      </div>
      <div class="footer">
        <p>🌾 CROPIC Nepal - तपाईंको कृषि साथी</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateOfficerEmail(
  type: string,
  officerName: string,
  farmerName: string,
  date: string,
  time: string,
  purpose: string,
  farmerPhone: string | null,
  notes: string | null
): string {
  const purposeLabels: Record<string, string> = {
    crop_advice: 'बाली सल्लाह',
    disease_consultation: 'रोग परामर्श',
    soil_testing: 'माटो परीक्षण',
    pest_control: 'कीट नियन्त्रण',
    seed_selection: 'बीउ छनोट',
    irrigation: 'सिंचाइ सल्लाह',
    fertilizer: 'मल प्रयोग',
    market_linkage: 'बजार जोडान',
    other: 'अन्य'
  };

  if (type === "confirmation") {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 नयाँ भेटघाट अनुरोध</h1>
        </div>
        <div class="content">
          <p>नमस्ते <strong>${officerName}</strong> जी,</p>
          <p>एक किसानले तपाईंसँग भेटघाट अनुरोध गर्नुभएको छ:</p>
          
          <div class="info-box">
            <p>👨‍🌾 <strong>किसान:</strong> ${farmerName}</p>
            <p>📅 <strong>मिति:</strong> ${date}</p>
            <p>🕐 <strong>समय:</strong> ${time}</p>
            <p>📋 <strong>उद्देश्य:</strong> ${purposeLabels[purpose] || purpose}</p>
            ${farmerPhone ? `<p>📞 <strong>सम्पर्क:</strong> ${farmerPhone}</p>` : ''}
            ${notes ? `<p>📝 <strong>टिप्पणी:</strong> ${notes}</p>` : ''}
          </div>
          
          <p>कृपया किसानलाई सहयोग गर्नुहोस्।</p>
        </div>
        <div class="footer">
          <p>🌾 CROPIC Nepal - कृषि विकासमा हाम्रो योगदान</p>
        </div>
      </div>
    </body>
    </html>
    `;
  } else if (type === "cancellation") {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ भेटघाट रद्द भयो</h1>
        </div>
        <div class="content">
          <p>नमस्ते <strong>${officerName}</strong> जी,</p>
          <p>निम्न भेटघाट रद्द गरिएको छ:</p>
          
          <div class="info-box">
            <p>👨‍🌾 <strong>किसान:</strong> ${farmerName}</p>
            <p>📅 <strong>मिति:</strong> ${date}</p>
            <p>🕐 <strong>समय:</strong> ${time}</p>
          </div>
        </div>
        <div class="footer">
          <p>🌾 CROPIC Nepal - कृषि विकासमा हाम्रो योगदान</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
  
  // Reminder
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Noto Sans Devanagari', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
      .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      .footer { background: #1f2937; color: #9ca3af; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔔 भोलिको भेटघाट सम्झना</h1>
      </div>
      <div class="content">
        <p>नमस्ते <strong>${officerName}</strong> जी,</p>
        <p>भोलि तपाईंको भेटघाट तोकिएको छ:</p>
        
        <div class="info-box">
          <p>👨‍🌾 <strong>किसान:</strong> ${farmerName}</p>
          <p>📅 <strong>मिति:</strong> ${date}</p>
          <p>🕐 <strong>समय:</strong> ${time}</p>
          <p>📋 <strong>उद्देश्य:</strong> ${purposeLabels[purpose] || purpose}</p>
          ${farmerPhone ? `<p>📞 <strong>सम्पर्क:</strong> ${farmerPhone}</p>` : ''}
        </div>
      </div>
      <div class="footer">
        <p>🌾 CROPIC Nepal - कृषि विकासमा हाम्रो योगदान</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
