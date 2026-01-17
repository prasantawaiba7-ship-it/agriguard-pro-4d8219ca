import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  farmer_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface OutbreakAlert {
  id: string;
  district: string;
  state: string;
  disease_name: string;
  detection_count: number;
  severity: string;
  first_detected_at: string;
  last_detected_at: string;
  is_active: boolean;
  affected_crops: string[];
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

// Show a local notification
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-icons/icon-192.png',
      badge: '/pwa-icons/icon-192.png',
      ...options,
    });
  }
}

export function useNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unread notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data: farmerProfile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!farmerProfile) return [];

      const { data, error } = await supabase
        .from('farmer_notifications')
        .select('*')
        .eq('farmer_id', farmerProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Fetch outbreak alerts for user's district
  const { data: outbreakAlerts } = useQuery({
    queryKey: ['outbreak-alerts', profile?.district, profile?.state],
    queryFn: async () => {
      if (!profile?.district && !profile?.state) return [];

      let query = supabase
        .from('disease_outbreak_alerts')
        .select('*')
        .eq('is_active', true);

      if (profile?.district) {
        query = query.eq('district', profile.district);
      }
      if (profile?.state) {
        query = query.eq('state', profile.state);
      }

      const { data, error } = await query.order('last_detected_at', { ascending: false });

      if (error) throw error;
      return data as OutbreakAlert[];
    },
    enabled: !!profile && (!!profile.district || !!profile.state),
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('farmer_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: farmerProfile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!farmerProfile) return;

      const { error } = await supabase
        .from('farmer_notifications')
        .update({ read: true })
        .eq('farmer_id', farmerProfile.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Enable push notifications
  const enablePushNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      toast({
        title: '🔔 सूचना सक्षम भयो',
        description: 'अब तपाईंले रोग प्रकोप सूचना प्राप्त गर्नुहुनेछ।',
      });
      return true;
    } else {
      toast({
        title: 'सूचना अस्वीकृत',
        description: 'ब्राउजर सेटिङमा गएर सूचना सक्षम गर्नुहोस्।',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return {
    notifications,
    outbreakAlerts,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    enablePushNotifications,
    isPushSupported: isPushSupported(),
  };
}

// Hook to check and show outbreak alerts
export function useOutbreakAlertChecker() {
  const { outbreakAlerts } = useNotifications();
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (!outbreakAlerts || outbreakAlerts.length === 0) return;

    // Show toast for new alerts
    outbreakAlerts.forEach(alert => {
      if (!shownAlerts.has(alert.id)) {
        toast({
          title: `⚠️ रोग प्रकोप चेतावनी`,
          description: `${alert.disease_name} - ${alert.district} जिल्लामा ${alert.detection_count} किसानले रिपोर्ट गरे`,
          variant: 'destructive',
          duration: 10000,
        });

        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          showLocalNotification(`⚠️ रोग प्रकोप: ${alert.disease_name}`, {
            body: `${alert.district} जिल्लामा ${alert.detection_count} किसानले यो रोग रिपोर्ट गरेका छन्।`,
            tag: `outbreak-${alert.id}`,
          });
        }

        setShownAlerts(prev => new Set([...prev, alert.id]));
      }
    });
  }, [outbreakAlerts, shownAlerts, toast]);
}
