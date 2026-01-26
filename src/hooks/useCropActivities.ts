import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ActivityType = 'sowing' | 'fertilizer' | 'spray' | 'irrigation' | 'weeding' | 'harvest' | 'other';

export interface CropActivity {
  id: string;
  user_id: string;
  plot_id: string | null;
  crop_name: string;
  activity_type: ActivityType;
  activity_date: string;
  notes: string | null;
  cost_npr: number | null;
  created_at: string;
}

export interface CreateActivityInput {
  plot_id?: string;
  crop_name: string;
  activity_type: ActivityType;
  activity_date: string;
  notes?: string;
  cost_npr?: number;
}

export const ACTIVITY_LABELS: Record<ActivityType, { en: string; ne: string; icon: string }> = {
  sowing: { en: 'Sowing', ne: 'बीउ रोप्ने', icon: '🌱' },
  fertilizer: { en: 'Fertilizer', ne: 'मल हाल्ने', icon: '🧪' },
  spray: { en: 'Spray', ne: 'औषधि छर्ने', icon: '💨' },
  irrigation: { en: 'Irrigation', ne: 'सिँचाइ', icon: '💧' },
  weeding: { en: 'Weeding', ne: 'गोडमेल', icon: '🌿' },
  harvest: { en: 'Harvest', ne: 'कटनी', icon: '🌾' },
  other: { en: 'Other', ne: 'अन्य', icon: '📝' },
};

export function useCropActivities(plotId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('crop_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });

      if (plotId) {
        query = query.eq('plot_id', plotId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities((data as CropActivity[]) || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, plotId]);

  const createActivity = useCallback(async (input: CreateActivityInput) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please login first', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('crop_activities')
        .insert({
          user_id: user.id,
          plot_id: input.plot_id || null,
          crop_name: input.crop_name,
          activity_type: input.activity_type,
          activity_date: input.activity_date,
          notes: input.notes || null,
          cost_npr: input.cost_npr || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'सफल!', description: 'गतिविधि record गरियो।' });
      await fetchActivities();
      return data as CropActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({ title: 'Error', description: 'Record गर्न सकिएन।', variant: 'destructive' });
      return null;
    }
  }, [user, toast, fetchActivities]);

  const deleteActivity = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('crop_activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Deleted!', description: 'Record हटाइयो।' });
      await fetchActivities();
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({ title: 'Error', description: 'Delete गर्न सकिएन।', variant: 'destructive' });
      return false;
    }
  }, [user, toast, fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    createActivity,
    deleteActivity,
    refresh: fetchActivities,
  };
}
