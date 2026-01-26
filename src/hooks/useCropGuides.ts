import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from './useLanguage';

export type GuideSection = 'introduction' | 'soil' | 'sowing' | 'fertilizer' | 'irrigation' | 'pests' | 'diseases' | 'harvest' | 'storage' | 'tips';

export interface CropGuide {
  id: string;
  crop_name: string;
  section: GuideSection;
  title: string;
  title_ne: string | null;
  content: string;
  content_ne: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const SECTION_LABELS: Record<GuideSection, { en: string; ne: string; icon: string }> = {
  introduction: { en: 'Introduction', ne: 'परिचय', icon: '📖' },
  soil: { en: 'Soil Preparation', ne: 'माटो तयारी', icon: '🏔️' },
  sowing: { en: 'Sowing', ne: 'बीउ रोप्ने', icon: '🌱' },
  fertilizer: { en: 'Fertilizer', ne: 'मल व्यवस्थापन', icon: '🧪' },
  irrigation: { en: 'Irrigation', ne: 'सिँचाइ', icon: '💧' },
  pests: { en: 'Pest Control', ne: 'कीरा नियन्त्रण', icon: '🐛' },
  diseases: { en: 'Disease Management', ne: 'रोग व्यवस्थापन', icon: '🦠' },
  harvest: { en: 'Harvesting', ne: 'कटनी', icon: '🌾' },
  storage: { en: 'Storage', ne: 'भण्डारण', icon: '🏠' },
  tips: { en: 'Tips & Tricks', ne: 'सुझाव', icon: '💡' },
};

export function useCropGuides(cropName?: string) {
  const { language } = useLanguage();
  const [guides, setGuides] = useState<CropGuide[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuides = useCallback(async () => {
    try {
      let query = supabase
        .from('crop_guides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (cropName) {
        query = query.eq('crop_name', cropName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGuides((data as CropGuide[]) || []);

      // Extract unique crop names
      const uniqueCrops = [...new Set((data || []).map((g: CropGuide) => g.crop_name))];
      setCrops(uniqueCrops);
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cropName]);

  const getLocalizedContent = useCallback((guide: CropGuide) => {
    return {
      title: language === 'ne' && guide.title_ne ? guide.title_ne : guide.title,
      content: language === 'ne' && guide.content_ne ? guide.content_ne : guide.content,
    };
  }, [language]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  return {
    guides,
    crops,
    isLoading,
    getLocalizedContent,
    refresh: fetchGuides,
  };
}
