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
  loading: boolean;
}

export const SUBSCRIPTION_PLANS = {
  monthly: {
    price_id: 'price_1Sq7E4K6BJzWBeP74jI2gpkN',
    product_id: 'prod_TnifXyUztVMKgt',
    name: 'Monthly',
    nameNe: 'मासिक',
    price: 99,
    currency: 'NPR'
  },
  yearly: {
    price_id: 'price_1Sq7F8K6BJzWBeP7edqzEwof',
    product_id: 'prod_TnigdkIT7X4QzJ',
    name: 'Yearly',
    nameNe: 'वार्षिक',
    price: 999,
    currency: 'NPR'
  }
};

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: 'free',
    queries_used: 0,
    queries_limit: 3,
    can_query: true,
    loading: true
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        plan: 'free',
        queries_used: 0,
        queries_limit: 3,
        can_query: true,
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

  const startCheckout = useCallback(async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    const priceId = SUBSCRIPTION_PLANS[plan].price_id;
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId }
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    ...status,
    checkSubscription,
    incrementQueryCount,
    startCheckout
  };
}
