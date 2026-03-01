import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      technicianEmail,
      technicianName,
      farmerName,
      cropName,
      problemTitle,
      problemDescription,
      ticketId,
      officeName,
      imageUrls,
    } = await req.json();

    // Validate required fields
    if (!technicianEmail || !problemTitle || !ticketId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: technicianEmail, problemTitle, ticketId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS") || "Kishan Sathi <onboarding@resend.dev>";
    const appDomain = Deno.env.get("APP_DOMAIN") || "https://id-preview--74cc2b70-798e-4937-b3c1-23bb65e8e2d3.lovable.app";

    const ticketLink = `${appDomain}/technician-dashboard?ticketId=${ticketId}`;
    const displayFarmer = farmerName || "एक किसान";
    const displayCrop = cropName || "बाली";

    // Build image list HTML
    let imageListHtml = "";
    if (imageUrls && imageUrls.length > 0) {
      imageListHtml = `
        <p style="margin-top:12px;font-weight:600;">संलग्न फोटोहरू:</p>
        <ul style="padding-left:20px;">
          ${imageUrls.map((url: string, i: number) => `<li><a href="${url}" target="_blank">फोटो ${i + 1}</a></li>`).join("")}
        </ul>
      `;
    }

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px;">
        <div style="background:#16a34a;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:18px;">🌾 Kishan Sathi — नयाँ प्रश्न प्राप्त!</h2>
        </div>
        <div style="background:white;padding:20px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
          <p>नमस्ते <strong>${technicianName || "प्राविधिक"}</strong> जी,</p>
          <p><strong>${displayFarmer}</strong> ले तपाईंलाई एउटा प्रश्न पठाउनुभएको छ।</p>
          
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:6px 0;color:#6b7280;width:120px;">कार्यालय:</td><td style="padding:6px 0;font-weight:600;">${officeName || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">बाली:</td><td style="padding:6px 0;font-weight:600;">${displayCrop}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">शीर्षक:</td><td style="padding:6px 0;font-weight:600;">${problemTitle}</td></tr>
          </table>
          
          <div style="background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;">
            <p style="margin:0;white-space:pre-wrap;">${problemDescription || problemTitle}</p>
          </div>

          ${imageListHtml}

          <a href="${ticketLink}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#16a34a;color:white;text-decoration:none;border-radius:8px;font-weight:600;">
            💬 जवाफ दिनुहोस्
          </a>
          
          <p style="margin-top:20px;font-size:12px;color:#9ca3af;">
            यो इमेल Kishan Sathi प्रणालीबाट स्वचालित रूपमा पठाइएको हो।
          </p>
        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [technicianEmail],
        subject: `[Kishan Sathi] नयाँ प्रश्न — ${displayCrop}`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ success: false, error: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("expert-email-notify error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
