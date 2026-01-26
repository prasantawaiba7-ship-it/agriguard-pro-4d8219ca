import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface WeatherAlertSettings {
  id: string;
  user_id: string;
  enable_weather_alerts: boolean;
  enable_rain_alert: boolean;
  enable_spray_alert: boolean;
  enable_heat_alert: boolean;
  enable_cold_alert: boolean;
  preferred_time: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<WeatherAlertSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enable_weather_alerts: true,
  enable_rain_alert: true,
  enable_spray_alert: true,
  enable_heat_alert: true,
  enable_cold_alert: false,
  preferred_time: 'morning',
};

export function useWeatherAlertSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<WeatherAlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('weather_alert_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as WeatherAlertSettings);
      } else {
        // Create default settings for new users
        const { data: newData, error: insertError } = await supabase
          .from('weather_alert_settings')
          .insert({
            user_id: user.id,
            ...DEFAULT_SETTINGS,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData as WeatherAlertSettings);
      }
    } catch (error) {
      console.error('Error fetching weather alert settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(async (updates: Partial<Omit<WeatherAlertSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user || !settings) {
      toast({ title: 'Error', description: 'Please login first', variant: 'destructive' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('weather_alert_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: 'सफल!', description: 'Alert settings अपडेट भयो।' });
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ title: 'Error', description: 'Settings save गर्न सकिएन।', variant: 'destructive' });
      return false;
    }
  }, [user, settings, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    refresh: fetchSettings,
  };
}
