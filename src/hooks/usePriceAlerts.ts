import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type PriceAlertCondition = 'greater_equal' | 'less_equal' | 'percent_increase' | 'percent_decrease';

export interface PriceAlert {
  id: string;
  user_id: string;
  crop_id: number | null;
  market_code: string | null;
  province_id: number | null;
  district_id: number | null;
  local_level_id: number | null;
  condition_type: PriceAlertCondition;
  threshold_value: number;
  percent_reference_days: number | null;
  is_recurring: boolean;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  crop?: { id: number; name_ne: string; name_en: string } | null;
  market?: { market_code: string; name_ne: string; name_en: string } | null;
}

export interface CreatePriceAlertInput {
  crop_id: number;
  market_code?: string | null;
  province_id?: number | null;
  district_id?: number | null;
  local_level_id?: number | null;
  condition_type: PriceAlertCondition;
  threshold_value: number;
  percent_reference_days?: number;
  is_recurring?: boolean;
}

export function usePriceAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('price_alerts')
        .select(`
          *,
          crop:crops(id, name_ne, name_en)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch market names separately if market_code exists
      const alertsWithMarkets = await Promise.all(
        (data || []).map(async (alert: any) => {
          if (alert.market_code) {
            const { data: marketData } = await supabase
              .from('markets')
              .select('market_code, name_ne, name_en')
              .eq('market_code', alert.market_code)
              .maybeSingle();
            return { ...alert, market: marketData };
          }
          return { ...alert, market: null };
        })
      );

      setAlerts(alertsWithMarkets as PriceAlert[]);
    } catch (err) {
      console.error('Error fetching price alerts:', err);
      setError('मूल्य अलर्टहरू लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (input: CreatePriceAlertInput): Promise<boolean> => {
    if (!user) {
      toast.error('कृपया पहिले लगइन गर्नुहोस्');
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          crop_id: input.crop_id,
          market_code: input.market_code || null,
          province_id: input.province_id || null,
          district_id: input.district_id || null,
          local_level_id: input.local_level_id || null,
          condition_type: input.condition_type,
          threshold_value: input.threshold_value,
          percent_reference_days: input.percent_reference_days || 7,
          is_recurring: input.is_recurring || false,
        });

      if (insertError) throw insertError;

      toast.success('मूल्य अलर्ट सेट भयो!');
      await fetchAlerts();
      return true;
    } catch (err) {
      console.error('Error creating price alert:', err);
      toast.error('अलर्ट सेट गर्न सकिएन');
      return false;
    }
  };

  const updateAlert = async (id: string, updates: Partial<PriceAlert>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('अलर्ट अपडेट भयो');
      await fetchAlerts();
      return true;
    } catch (err) {
      console.error('Error updating price alert:', err);
      toast.error('अलर्ट अपडेट गर्न सकिएन');
      return false;
    }
  };

  const deleteAlert = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('अलर्ट हटाइयो');
      setAlerts(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting price alert:', err);
      toast.error('अलर्ट हटाउन सकिएन');
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    return updateAlert(id, { is_active: isActive });
  };

  return {
    alerts,
    isLoading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleActive,
    refresh: fetchAlerts,
  };
}
