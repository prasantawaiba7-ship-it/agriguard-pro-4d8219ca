import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import type { Json } from '@/integrations/supabase/types';

export interface NotificationPreferences {
  id: string;
  farmer_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  outbreak_alerts: boolean;
  weather_alerts: boolean;
  push_subscription: Json | null;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First get farmer profile
      const { data: farmerProfile } = await supabase
        .from('farmer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!farmerProfile) return null;

      // Try to get existing preferences
      const { data, error } = await supabase
        .from('farmer_notification_preferences')
        .select('*')
        .eq('farmer_id', farmerProfile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default
        const { data: newPrefs, error: createError } = await supabase
          .from('farmer_notification_preferences')
          .insert({
            farmer_id: farmerProfile.id,
            push_enabled: true,
            email_enabled: true,
            sms_enabled: false,
            outbreak_alerts: true,
            weather_alerts: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newPrefs as NotificationPreferences;
      }

      if (error) throw error;
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, 'id' | 'farmer_id' | 'created_at' | 'updated_at' | 'push_subscription'>>) => {
      if (!preferences?.id) throw new Error('No preferences found');

      const { error } = await supabase
        .from('farmer_notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preferences.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: '✅ सेटिङ सुरक्षित भयो',
        description: 'तपाईंको सूचना प्राथमिकताहरू अपडेट गरियो।',
      });
    },
    onError: (error) => {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'त्रुटि',
        description: 'सेटिङ सुरक्षित गर्न सकिएन। पुन: प्रयास गर्नुहोस्।',
        variant: 'destructive',
      });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
