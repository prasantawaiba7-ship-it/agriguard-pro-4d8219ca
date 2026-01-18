import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Email templates
const getSuccessEmailHtml = (customerName: string, planName: string, amount: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 30px;">✓</span>
      </div>
      <h1 style="color: #16a34a; margin: 0; font-size: 24px;">भुक्तानी सफल!</h1>
      <p style="color: #666; margin: 5px 0;">Payment Successful!</p>
    </div>
    
    <p style="color: #333;">नमस्ते ${customerName},</p>
    <p style="color: #555;">तपाईंको <strong>${planName}</strong> सदस्यता सक्रिय भयो। धन्यवाद!</p>
    <p style="color: #555;">Your subscription is now active. Thank you for subscribing!</p>
    
    <div style="background: #f0fdf4; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #166534;"><strong>योजना / Plan:</strong> ${planName}</p>
      <p style="margin: 5px 0 0; color: #166534;"><strong>रकम / Amount:</strong> ${amount}</p>
    </div>
    
    <p style="color: #555; font-size: 14px;">अब तपाईंले असीमित AI कृषि सल्लाह प्राप्त गर्न सक्नुहुन्छ।</p>
    <p style="color: #555; font-size: 14px;">You now have unlimited access to AI farming advice.</p>
    
    <div style="text-align: center; margin-top: 25px;">
      <a href="https://krishi-mitra.lovable.app/krishi-mitra" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
        कृषि मित्र प्रयोग गर्नुहोस्
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      Farmer Gpt - तपाईंको कृषि साथी<br>
      Farmer Gpt - Your Farming Companion
    </p>
  </div>
</body>
</html>
`;

const getFailedEmailHtml = (customerName: string, reason: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 30px;">!</span>
      </div>
      <h1 style="color: #dc2626; margin: 0; font-size: 24px;">भुक्तानी असफल</h1>
      <p style="color: #666; margin: 5px 0;">Payment Failed</p>
    </div>
    
    <p style="color: #333;">नमस्ते ${customerName},</p>
    <p style="color: #555;">तपाईंको सदस्यता भुक्तानी असफल भयो।</p>
    <p style="color: #555;">Your subscription payment was unsuccessful.</p>
    
    <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #991b1b;"><strong>कारण / Reason:</strong> ${reason}</p>
    </div>
    
    <p style="color: #555; font-size: 14px;">कृपया आफ्नो भुक्तानी विधि अपडेट गर्नुहोस्।</p>
    <p style="color: #555; font-size: 14px;">Please update your payment method to continue your subscription.</p>
    
    <div style="text-align: center; margin-top: 25px;">
      <a href="https://krishi-mitra.lovable.app/farmer/profile" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
        भुक्तानी अपडेट गर्नुहोस्
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      Farmer Gpt - तपाईंको कृषि साथी<br>
      Farmer Gpt - Your Farming Companion
    </p>
  </div>
</body>
</html>
`;

const getRenewalReminderHtml = (customerName: string, renewalDate: string, planName: string, amount: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 30px;">🔔</span>
      </div>
      <h1 style="color: #d97706; margin: 0; font-size: 24px;">नवीकरण सूचना</h1>
      <p style="color: #666; margin: 5px 0;">Renewal Reminder</p>
    </div>
    
    <p style="color: #333;">नमस्ते ${customerName},</p>
    <p style="color: #555;">तपाईंको सदस्यता छिट्टै नवीकरण हुनेछ।</p>
    <p style="color: #555;">Your subscription will renew soon.</p>
    
    <div style="background: #fffbeb; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>योजना / Plan:</strong> ${planName}</p>
      <p style="margin: 5px 0 0; color: #92400e;"><strong>नवीकरण मिति / Renewal Date:</strong> ${renewalDate}</p>
      <p style="margin: 5px 0 0; color: #92400e;"><strong>रकम / Amount:</strong> ${amount}</p>
    </div>
    
    <p style="color: #555; font-size: 14px;">कुनै कार्य आवश्यक छैन। तपाईंको सदस्यता स्वचालित रूपमा नवीकरण हुनेछ।</p>
    <p style="color: #555; font-size: 14px;">No action needed. Your subscription will auto-renew.</p>
    
    <div style="text-align: center; margin-top: 25px;">
      <a href="https://krishi-mitra.lovable.app/farmer/profile" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
        सदस्यता व्यवस्थापन
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">
      Farmer Gpt - तपाईंको कृषि साथी<br>
      Farmer Gpt - Your Farming Companion
    </p>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const event = JSON.parse(body);
    
    logStep("Event type", { type: event.type });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const customerEmail = invoice.customer_email;
        const amountPaid = (invoice.amount_paid / 100).toFixed(2);
        
        logStep("Payment succeeded", { customerId, email: customerEmail, amount: amountPaid });

        // Get customer name
        const customer = await stripe.customers.retrieve(customerId as string);
        const customerName = (customer as Stripe.Customer).name || "Farmer";

        // Determine plan name
        const planName = invoice.lines?.data[0]?.description || "Premium Plan";

        // Update subscription status in database
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_end: new Date(invoice.lines?.data[0]?.period?.end * 1000).toISOString()
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          logStep("Database update error", { error: updateError });
        }

        // Send success email
        if (customerEmail) {
          const { error: emailError } = await resend.emails.send({
            from: "Farmer Gpt <noreply@resend.dev>",
            to: [customerEmail],
            subject: "✅ भुक्तानी सफल - Payment Successful | Farmer Gpt",
            html: getSuccessEmailHtml(customerName, planName, `रु. ${amountPaid}`),
          });

          if (emailError) {
            logStep("Email send error", { error: emailError });
          } else {
            logStep("Success email sent", { to: customerEmail });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const customerEmail = invoice.customer_email;
        const failureReason = invoice.last_payment_error?.message || "Payment declined";

        logStep("Payment failed", { customerId, email: customerEmail, reason: failureReason });

        const customer = await stripe.customers.retrieve(customerId as string);
        const customerName = (customer as Stripe.Customer).name || "Farmer";

        // Send failure email
        if (customerEmail) {
          const { error: emailError } = await resend.emails.send({
            from: "Farmer Gpt <noreply@resend.dev>",
            to: [customerEmail],
            subject: "⚠️ भुक्तानी असफल - Payment Failed | Farmer Gpt",
            html: getFailedEmailHtml(customerName, failureReason),
          });

          if (emailError) {
            logStep("Email send error", { error: emailError });
          } else {
            logStep("Failure email sent", { to: customerEmail });
          }
        }
        break;
      }

      case "invoice.upcoming": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const customerEmail = invoice.customer_email;
        const amountDue = (invoice.amount_due / 100).toFixed(2);
        const renewalDate = new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        logStep("Upcoming renewal", { customerId, email: customerEmail, date: renewalDate });

        const customer = await stripe.customers.retrieve(customerId as string);
        const customerName = (customer as Stripe.Customer).name || "Farmer";
        const planName = invoice.lines?.data[0]?.description || "Premium Plan";

        // Send renewal reminder email
        if (customerEmail) {
          const { error: emailError } = await resend.emails.send({
            from: "Farmer Gpt <noreply@resend.dev>",
            to: [customerEmail],
            subject: "🔔 नवीकरण सूचना - Renewal Reminder | Farmer Gpt",
            html: getRenewalReminderHtml(customerName, renewalDate, planName, `रु. ${amountDue}`),
          });

          if (emailError) {
            logStep("Email send error", { error: emailError });
          } else {
            logStep("Renewal reminder sent", { to: customerEmail });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        logStep("Subscription cancelled", { customerId });

        // Update subscription status
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({ status: 'cancelled', plan: 'free' })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          logStep("Database update error", { error: updateError });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
