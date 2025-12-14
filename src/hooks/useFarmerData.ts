import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Plot = Database['public']['Tables']['plots']['Row'];
type CropPhoto = Database['public']['Tables']['crop_photos']['Row'];
type AIAnalysisResult = Database['public']['Tables']['ai_analysis_results']['Row'];
type CropType = Database['public']['Enums']['crop_type'];
type CropStage = Database['public']['Enums']['crop_stage'];

interface PlotWithAnalysis extends Plot {
  latestPhoto?: CropPhoto & { analysis?: AIAnalysisResult };
  healthScore?: number;
}

export function usePlots() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['plots', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: plots, error } = await supabase
        .from('plots')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch latest photo and analysis for each plot
      const plotsWithAnalysis: PlotWithAnalysis[] = await Promise.all(
        (plots || []).map(async (plot) => {
          const { data: photos } = await supabase
            .from('crop_photos')
            .select('*, ai_analysis_results(*)')
            .eq('plot_id', plot.id)
            .order('captured_at', { ascending: false })
            .limit(1);

          const latestPhoto = photos?.[0];
          const analysis = latestPhoto?.ai_analysis_results?.[0];

          return {
            ...plot,
            latestPhoto: latestPhoto ? { ...latestPhoto, analysis } : undefined,
            healthScore: analysis?.health_score ? Number(analysis.health_score) * 100 : undefined
          };
        })
      );

      return plotsWithAnalysis;
    },
    enabled: !!profile?.id,
  });
}

export function useCreatePlot() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (plotData: {
      plot_name: string;
      crop_type: CropType;
      area_hectares?: number;
      latitude?: number;
      longitude?: number;
      village?: string;
      district?: string;
      state?: string;
      season?: string;
      sowing_date?: string;
      pmfby_insured?: boolean;
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('plots')
        .insert({
          ...plotData,
          farmer_id: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast({
        title: 'Plot created',
        description: 'Your new plot has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCropPhotos(plotId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['crop-photos', plotId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      let query = supabase
        .from('crop_photos')
        .select('*, plots(plot_name, crop_type), ai_analysis_results(*)')
        .eq('farmer_id', profile.id)
        .order('captured_at', { ascending: false });

      if (plotId) {
        query = query.eq('plot_id', plotId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });
}

export function useUploadPhoto() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      plotId,
      file,
      stage,
      notes,
      latitude,
      longitude
    }: {
      plotId: string;
      file: File;
      stage: CropStage;
      notes?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // Upload image to storage
      const fileName = `${profile.id}/${plotId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crop-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('crop-photos')
        .getPublicUrl(uploadData.path);

      // Create photo record
      const { data: photo, error: photoError } = await supabase
        .from('crop_photos')
        .insert({
          plot_id: plotId,
          farmer_id: profile.id,
          image_url: publicUrl,
          capture_stage: stage,
          notes,
          latitude,
          longitude
        })
        .select()
        .single();

      if (photoError) throw photoError;
      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-photos'] });
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast({
        title: 'Photo uploaded',
        description: 'Your crop photo has been uploaded and is being analyzed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useWeatherData(latitude?: number, longitude?: number) {
  return useQuery({
    queryKey: ['weather', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-weather`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch weather');
      return response.json();
    },
    enabled: !!latitude && !!longitude,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSoilData(latitude?: number, longitude?: number) {
  return useQuery({
    queryKey: ['soil', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-soil-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch soil data');
      return response.json();
    },
    enabled: !!latitude && !!longitude,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useDashboardStats() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Get plots count
      const { count: plotsCount } = await supabase
        .from('plots')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', profile.id);

      // Get photos count
      const { count: photosCount } = await supabase
        .from('crop_photos')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', profile.id);

      // Get healthy crops count
      const { data: healthyData } = await supabase
        .from('ai_analysis_results')
        .select('id, crop_photos!inner(farmer_id)')
        .eq('crop_photos.farmer_id', profile.id)
        .eq('health_status', 'healthy');

      // Get alerts count
      const { data: alertsData } = await supabase
        .from('ai_analysis_results')
        .select('id, crop_photos!inner(farmer_id)')
        .eq('crop_photos.farmer_id', profile.id)
        .in('health_status', ['moderate_stress', 'severe_damage']);

      return {
        plots: plotsCount || 0,
        photos: photosCount || 0,
        healthyCrops: healthyData?.length || 0,
        alerts: alertsData?.length || 0,
      };
    },
    enabled: !!profile?.id,
  });
}
