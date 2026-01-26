import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ESEWA-VERIFY] ${step}${detailsStr}`);
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

    const { transaction_uuid, encoded_response } = await req.json();
    
    if (!transaction_uuid) throw new Error("Transaction UUID is required");
    logStep("Verifying transaction", { transaction_uuid });

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*, subscription_plans(*)')
      .eq('transaction_uuid', transaction_uuid)
      .single();

    if (paymentError || !payment) {
      logStep("Payment not found", { error: paymentError?.message });
      throw new Error("Payment record not found");
    }

    if (payment.status === 'success') {
      logStep("Payment already verified");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already verified",
        payment 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Payment found", { paymentId: payment.id, amount: payment.amount_npr });

    // Decode and parse eSewa response
    let esewaResponse: any = null;
    if (encoded_response) {
      try {
        const decodedBytes = base64Decode(encoded_response);
        const decodedString = new TextDecoder().decode(decodedBytes);
        esewaResponse = JSON.parse(decodedString);
        logStep("eSewa response decoded", esewaResponse);
      } catch (e) {
        logStep("Failed to decode eSewa response", { error: e });
      }
    }

    // Verify with eSewa transaction status API
    const merchantCode = Deno.env.get("ESEWA_MERCHANT_CODE") || "EPAYTEST";
    const verifyUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${merchantCode}&total_amount=${payment.amount_npr}&transaction_uuid=${transaction_uuid}`;
    
    logStep("Calling eSewa verification API", { url: verifyUrl });

    const verifyResponse = await fetch(verifyUrl);
    const verifyData = await verifyResponse.json();
    
    logStep("eSewa verification response", verifyData);

    // Check if payment was successful
    const isSuccess = verifyData.status === "COMPLETE" || 
                      (esewaResponse && esewaResponse.status === "COMPLETE");

    if (isSuccess) {
      logStep("Payment verified successfully");

      // Update payment status
      const { error: updatePaymentError } = await supabaseClient
        .from('payments')
        .update({
          status: 'success',
          esewa_ref_id: verifyData.ref_id || esewaResponse?.ref_id || null,
          raw_payload: verifyData
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        logStep("Failed to update payment", { error: updatePaymentError.message });
      }

      // Calculate subscription dates
      const plan = payment.subscription_plans;
      const startDate = new Date();
      const endDate = new Date();
      
      // Get duration from plan (default 30 days for monthly, 365 for yearly)
      let durationDays = 30;
      if (plan.plan_type === 'yearly') {
        durationDays = 365;
      } else if (plan.plan_type === 'monthly') {
        durationDays = 30;
      }
      
      endDate.setDate(endDate.getDate() + durationDays);

      logStep("Subscription dates calculated", { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        durationDays 
      });

      // Check for existing subscription
      const { data: existingSub } = await supabaseClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', payment.user_id)
        .single();

      // Determine plan type for enum
      let planType: 'free' | 'monthly' | 'yearly' = 'monthly';
      if (plan.plan_type === 'yearly') {
        planType = 'yearly';
      }

      if (existingSub) {
        // Update existing subscription
        const { error: updateSubError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            plan: planType,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            queries_limit: plan.ai_call_limit || 999999,
            queries_used: 0
          })
          .eq('user_id', payment.user_id);

        if (updateSubError) {
          logStep("Failed to update subscription", { error: updateSubError.message });
        } else {
          logStep("Subscription updated");
        }
      } else {
        // Create new subscription
        const { error: createSubError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: payment.user_id,
            plan: planType,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            queries_limit: plan.ai_call_limit || 999999,
            queries_used: 0
          });

        if (createSubError) {
          logStep("Failed to create subscription", { error: createSubError.message });
        } else {
          logStep("Subscription created");
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Payment verified and subscription activated",
        plan_name: plan.name,
        end_date: endDate.toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      logStep("Payment verification failed", { status: verifyData.status });

      // Update payment as failed
      await supabaseClient
        .from('payments')
        .update({
          status: 'failed',
          raw_payload: verifyData
        })
        .eq('id', payment.id);

      return new Response(JSON.stringify({
        success: false,
        message: "Payment verification failed",
        status: verifyData.status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
