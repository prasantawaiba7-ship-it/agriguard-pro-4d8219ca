import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ESEWA-INITIATE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { plan_id } = await req.json();
    if (!plan_id) throw new Error("Plan ID is required");
    logStep("Plan ID received", { plan_id });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found or inactive");
    }
    logStep("Plan found", { planName: plan.name, price: plan.price });

    // Generate unique transaction UUID
    const transaction_uuid = crypto.randomUUID();
    logStep("Transaction UUID generated", { transaction_uuid });

    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount_npr: plan.price,
        transaction_uuid: transaction_uuid,
        status: 'pending'
      });

    if (paymentError) {
      logStep("Payment record error", { error: paymentError.message });
      throw new Error("Failed to create payment record");
    }
    logStep("Payment record created");

    // eSewa configuration
    const merchantCode = Deno.env.get("ESEWA_MERCHANT_CODE") || "EPAYTEST";
    const secretKey = Deno.env.get("ESEWA_SECRET_KEY") || "8gBm/:&EnhH.1/q";
    
    // eSewa requires amount in paisa for test, but NPR for production
    // For test environment, we use the amount directly
    const totalAmount = plan.price.toString();
    const taxAmount = "0";
    const productServiceCharge = "0";
    const productDeliveryCharge = "0";
    const amount = totalAmount;

    // Create signature message
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transaction_uuid},product_code=${merchantCode}`;
    
    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const messageData = encoder.encode(signatureMessage);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = new Uint8Array(signatureBuffer);
    const signature = btoa(String.fromCharCode(...signatureArray));
    
    logStep("Signature generated");

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://lovable.app";

    // eSewa payment form data
    const esewaData = {
      amount: amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      transaction_uuid: transaction_uuid,
      product_code: merchantCode,
      product_service_charge: productServiceCharge,
      product_delivery_charge: productDeliveryCharge,
      success_url: `${origin}/payment/success?transaction_uuid=${transaction_uuid}`,
      failure_url: `${origin}/payment/cancelled?transaction_uuid=${transaction_uuid}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    // eSewa payment URL (test environment)
    const esewaUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

    logStep("eSewa payment data prepared", { 
      transaction_uuid,
      amount: totalAmount,
      merchantCode 
    });

    return new Response(JSON.stringify({
      esewa_url: esewaUrl,
      form_data: esewaData,
      transaction_uuid: transaction_uuid
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
