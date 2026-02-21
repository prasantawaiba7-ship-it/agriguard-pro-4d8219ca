import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader === "Bearer " || authHeader === "Bearer null" || authHeader === "Bearer undefined") {
      logStep("No valid auth header, returning free defaults");
      return new Response(JSON.stringify({
        subscribed: false,
        plan: 'free',
        subscription_end: null,
        queries_used: 0,
        queries_limit: 3,
        can_query: true,
        is_admin: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error, returning free defaults", { error: userError.message });
      return new Response(JSON.stringify({
        subscribed: false,
        plan: 'free',
        subscription_end: null,
        queries_used: 0,
        queries_limit: 3,
        can_query: true,
        is_admin: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get or create subscription record
    let { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription) {
      // Create free subscription record
      const { data: newSub, error: insertError } = await supabaseClient
        .from('user_subscriptions')
        .insert({ 
          user_id: user.id, 
          plan: 'free', 
          status: 'active',
          queries_used: 0, 
          queries_limit: 3 
        })
        .select()
        .single();
      
      if (insertError) {
        logStep("Error creating subscription", { error: insertError.message });
      } else {
        subscription = newSub;
        logStep("Created new free subscription");
      }
    }

    // Check if subscription is expired
    const now = new Date();
    let isActive = false;
    let isPro = false;

    if (subscription) {
      if (subscription.plan === 'free') {
        isActive = true;
        isPro = false;
      } else if (subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        isActive = endDate > now && subscription.status === 'active';
        isPro = isActive;
        
        // If expired, update status
        if (!isActive && subscription.status === 'active') {
          await supabaseClient
            .from('user_subscriptions')
            .update({ status: 'expired', plan: 'free' })
            .eq('user_id', user.id);
          logStep("Subscription expired, updated to free");
        }
      }
    }

    logStep("Subscription status", { 
      plan: subscription?.plan, 
      isActive, 
      isPro,
      endDate: subscription?.current_period_end 
    });

    // Check if user is admin (admins bypass query limits)
    const { data: adminRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;

    return new Response(JSON.stringify({
      subscribed: isPro,
      plan: subscription?.plan || 'free',
      subscription_end: subscription?.current_period_end || null,
      queries_used: subscription?.queries_used || 0,
      queries_limit: subscription?.queries_limit || 3,
      can_query: isAdmin || isPro || (subscription?.queries_used || 0) < (subscription?.queries_limit || 3),
      is_admin: isAdmin
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
