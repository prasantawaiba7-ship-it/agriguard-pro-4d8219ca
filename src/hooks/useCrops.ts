import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Crop {
  id: number;
  name_en: string;
  name_ne: string;
  category: string;
  region_group: string | null;
  image_url: string | null;
  image_url_ai_suggested: string | null;
  image_url_uploaded: string | null;
  image_source: 'ai' | 'admin_upload' | 'external' | 'none' | null;
  needs_image_review: boolean;
  unit: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('crops')
        .select('*')
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setCrops((data || []) as Crop[]);
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError('बाली लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Admin functions
  const addCrop = async (crop: Omit<Crop, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .insert(crop)
        .select()
        .single();

      if (error) throw error;
      await fetchCrops();
      return { data: data as Crop, error: null };
    } catch (err) {
      console.error('Error adding crop:', err);
      return { data: null, error: err };
    }
  };

  const updateCrop = async (id: number, updates: Partial<Crop>) => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchCrops();
      return { data: data as Crop, error: null };
    } catch (err) {
      console.error('Error updating crop:', err);
      return { data: null, error: err };
    }
  };

  const toggleCropActive = async (id: number, isActive: boolean) => {
    return updateCrop(id, { is_active: !isActive });
  };

  const deleteCrop = async (id: number) => {
    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCrops();
      return { error: null };
    } catch (err) {
      console.error('Error deleting crop:', err);
      return { error: err };
    }
  };

  // Get active crops only
  const activeCrops = crops.filter(c => c.is_active);

  // Group crops by category
  const cropsByCategory = crops.reduce((acc, crop) => {
    if (!acc[crop.category]) {
      acc[crop.category] = [];
    }
    acc[crop.category].push(crop);
    return acc;
  }, {} as Record<string, Crop[]>);

  return {
    crops,
    activeCrops,
    cropsByCategory,
    isLoading,
    error,
    refresh: fetchCrops,
    addCrop,
    updateCrop,
    toggleCropActive,
    deleteCrop,
  };
}
