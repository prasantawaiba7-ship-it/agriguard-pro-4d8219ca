import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WeatherAlert {
  id: string;
  user_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  date_sent: string;
  created_at: string;
}

export function useWeatherAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('date_sent', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, is_read: true } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  return {
    alerts,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchAlerts,
  };
}
