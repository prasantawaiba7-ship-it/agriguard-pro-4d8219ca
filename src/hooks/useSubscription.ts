import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  subscription_end?: string;
  queries_used: number;
  queries_limit: number;
  can_query: boolean;
  is_admin: boolean;
  loading: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  description_ne: string | null;
  plan_type: string;
  price: number;
  currency: string;
  ai_call_limit: number | null;
  pdf_report_limit: number | null;
  features: string[];
  is_visible: boolean;
  is_active: boolean;
  display_order: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: 'free',
    queries_used: 0,
    queries_limit: 3,
    can_query: true,
    is_admin: false,
    loading: true
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        plan: 'free',
        queries_used: 0,
        queries_limit: 3,
        can_query: true,
        is_admin: false,
        loading: false
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setStatus({
        ...data,
        loading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_visible', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const parsedPlans = (data || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(String(p.features) || '[]')
      }));
      
      setPlans(parsedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const incrementQueryCount = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase.rpc('increment_query_count', { p_user_id: user.id });
      // Refresh subscription status
      await checkSubscription();
    } catch (error) {
      console.error('Error incrementing query count:', error);
    }
  }, [user, checkSubscription]);

  const startEsewaPayment = useCallback(async (planId: string) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    const { data, error } = await supabase.functions.invoke('esewa-initiate', {
      body: { plan_id: planId }
    });

    if (error) throw error;
    
    if (data?.esewa_url && data?.form_data) {
      // Create and submit form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.esewa_url;
      
      Object.entries(data.form_data).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    }

    return data;
  }, [user]);

  const verifyPayment = useCallback(async (transactionUuid: string, encodedResponse?: string) => {
    const { data, error } = await supabase.functions.invoke('esewa-verify', {
      body: { 
        transaction_uuid: transactionUuid,
        encoded_response: encodedResponse
      }
    });

    if (error) throw error;
    
    // Refresh subscription status after verification
    await checkSubscription();
    
    return data;
  }, [checkSubscription]);

  // Only check subscription when user is available
  useEffect(() => {
    // Don't call the edge function if user is still loading or not logged in
    if (user) {
      checkSubscription();
    } else {
      // Reset to default free status when no user
      setStatus({
        subscribed: false,
        plan: 'free',
        queries_used: 0,
        queries_limit: 3,
        can_query: true,
        is_admin: false,
        loading: false
      });
    }
  }, [user]); // Only depend on user, not checkSubscription to avoid loops

  // Fetch plans independently (doesn't require auth)
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Auto-refresh every minute only when user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    ...status,
    plans,
    plansLoading,
    checkSubscription,
    incrementQueryCount,
    startEsewaPayment,
    verifyPayment,
    fetchPlans
  };
}
