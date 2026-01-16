import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get or create subscription record
    let { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) {
      // Create subscription record
      const { data: newSub, error: insertError } = await supabaseClient
        .from('user_subscriptions')
        .insert({ user_id: user.id, plan: 'free', queries_used: 0, queries_limit: 3 })
        .select()
        .single();
      
      if (insertError) {
        logStep("Error creating subscription", { error: insertError.message });
      } else {
        subscription = newSub;
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: 'free',
        queries_used: subscription?.queries_used || 0,
        queries_limit: subscription?.queries_limit || 3,
        can_query: (subscription?.queries_used || 0) < (subscription?.queries_limit || 3)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let plan = 'free';
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const stripeSub = subscriptions.data[0];
      subscriptionEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
      const priceId = stripeSub.items.data[0].price.id;
      
      // Determine plan based on price
      if (priceId === 'price_1Sq7E4K6BJzWBeP74jI2gpkN') {
        plan = 'monthly';
      } else if (priceId === 'price_1Sq7F8K6BJzWBeP7edqzEwof') {
        plan = 'yearly';
      }
      logStep("Active subscription found", { plan, endDate: subscriptionEnd });

      // Update subscription record in database
      await supabaseClient
        .from('user_subscriptions')
        .update({
          plan,
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSub.id,
          current_period_end: subscriptionEnd
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd,
      queries_used: subscription?.queries_used || 0,
      queries_limit: subscription?.queries_limit || 3,
      can_query: hasActiveSub || (subscription?.queries_used || 0) < (subscription?.queries_limit || 3)
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
