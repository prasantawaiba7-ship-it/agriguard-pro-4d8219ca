import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CropSeason {
  id: string;
  field_id: string;
  user_id: string;
  crop_name: string;
  variety: string | null;
  season_start_date: string;
  season_end_date: string | null;
  expected_yield: number | null;
  actual_yield: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCropSeasons(fieldId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSeasons = useCallback(async () => {
    if (!user) {
      setSeasons([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('crop_seasons')
        .select('*')
        .eq('user_id', user.id)
        .order('season_start_date', { ascending: false });

      if (fieldId) {
        query = query.eq('field_id', fieldId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSeasons(data || []);
    } catch (error) {
      console.error('Error fetching crop seasons:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fieldId]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const createSeason = async (data: Omit<CropSeason, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data: newSeason, error } = await supabase
        .from('crop_seasons')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'बाली सिजन थपियो',
        description: `${data.crop_name} सफलतापूर्वक थपियो।`,
      });

      await fetchSeasons();
      return newSeason;
    } catch (error) {
      console.error('Error creating crop season:', error);
      toast({
        title: 'त्रुटि',
        description: 'बाली सिजन थप्न सकिएन।',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSeason = async (id: string, data: Partial<CropSeason>) => {
    try {
      const { error } = await supabase
        .from('crop_seasons')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'बाली सिजन अपडेट भयो',
      });

      await fetchSeasons();
      return true;
    } catch (error) {
      console.error('Error updating crop season:', error);
      toast({
        title: 'त्रुटि',
        description: 'बाली सिजन अपडेट गर्न सकिएन।',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSeason = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crop_seasons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'बाली सिजन हटाइयो',
      });

      await fetchSeasons();
      return true;
    } catch (error) {
      console.error('Error deleting crop season:', error);
      toast({
        title: 'त्रुटि',
        description: 'बाली सिजन हटाउन सकिएन।',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    seasons,
    isLoading,
    createSeason,
    updateSeason,
    deleteSeason,
    refetch: fetchSeasons,
  };
}
