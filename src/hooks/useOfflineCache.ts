import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const CACHE_KEYS = {
  CROP_RECOMMENDATIONS: 'krishi_offline_crop_recommendations',
  DISEASE_DETECTIONS: 'krishi_offline_disease_detections',
  FARMER_PROFILE: 'krishi_offline_farmer_profile',
  PLOTS: 'krishi_offline_plots',
  LAST_SYNC: 'krishi_offline_last_sync',
};

interface CachedCropRecommendation {
  id: string;
  plot_id: string;
  recommended_crops: any;
  yield_forecast: any;
  profit_margins: any;
  sustainability_score: number | null;
  soil_health_score: number | null;
  input_recommendations: any;
  reasoning: string | null;
  language: string | null;
  created_at: string;
  plot_name?: string;
}

interface CachedDiseaseDetection {
  id: string;
  image_url: string;
  detected_disease: string | null;
  severity: string | null;
  confidence_score: number | null;
  treatment_recommendations: any;
  prevention_tips: string[] | null;
  language: string | null;
  analyzed_at: string;
  created_at: string;
}

interface CachedFarmerProfile {
  id: string;
  full_name: string;
  phone: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  preferred_language: string | null;
}

interface CachedPlot {
  id: string;
  plot_name: string;
  crop_type: string;
  area_hectares: number | null;
  village: string | null;
  district: string | null;
}

interface OfflineCache {
  cropRecommendations: CachedCropRecommendation[];
  diseaseDetections: CachedDiseaseDetection[];
  farmerProfile: CachedFarmerProfile | null;
  plots: CachedPlot[];
  lastSync: Date | null;
}

// Save data to localStorage with expiry
function saveToCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to save ${key} to cache:`, error);
  }
}

// Load data from localStorage
function loadFromCache<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.data as T;
  } catch (error) {
    console.error(`Failed to load ${key} from cache:`, error);
    return null;
  }
}

export function useOfflineCache() {
  const { user } = useAuth();
  const { isOnline, wasOffline } = useNetworkStatus();
  
  const [cache, setCache] = useState<OfflineCache>({
    cropRecommendations: [],
    diseaseDetections: [],
    farmerProfile: null,
    plots: [],
    lastSync: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      const cropRecommendations = loadFromCache<CachedCropRecommendation[]>(CACHE_KEYS.CROP_RECOMMENDATIONS) || [];
      const diseaseDetections = loadFromCache<CachedDiseaseDetection[]>(CACHE_KEYS.DISEASE_DETECTIONS) || [];
      const farmerProfile = loadFromCache<CachedFarmerProfile>(CACHE_KEYS.FARMER_PROFILE);
      const plots = loadFromCache<CachedPlot[]>(CACHE_KEYS.PLOTS) || [];
      const lastSyncStr = loadFromCache<string>(CACHE_KEYS.LAST_SYNC);
      
      setCache({
        cropRecommendations,
        diseaseDetections,
        farmerProfile,
        plots,
        lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
      });
    };

    loadCachedData();
  }, []);

  // Sync data when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && user) {
      syncFromServer();
    }
  }, [isOnline, wasOffline, user]);

  // Sync data from server
  const syncFromServer = useCallback(async () => {
    if (!user || !isOnline) return;
    
    setIsSyncing(true);
    
    try {
      // Get farmer profile
      const { data: profileData } = await supabase
        .from('farmer_profiles')
        .select('id, full_name, phone, village, district, state, preferred_language')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        saveToCache(CACHE_KEYS.FARMER_PROFILE, profileData);
        
        // Get plots
        const { data: plotsData } = await supabase
          .from('plots')
          .select('id, plot_name, crop_type, area_hectares, village, district')
          .eq('farmer_id', profileData.id)
          .order('created_at', { ascending: false });

        if (plotsData) {
          saveToCache(CACHE_KEYS.PLOTS, plotsData);
        }

        // Get recent crop recommendations (last 10)
        const { data: recommendationsData } = await supabase
          .from('crop_recommendations')
          .select(`
            id, plot_id, recommended_crops, yield_forecast, profit_margins,
            sustainability_score, soil_health_score, input_recommendations,
            reasoning, language, created_at
          `)
          .eq('farmer_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recommendationsData && plotsData) {
          // Enrich with plot names
          const enrichedRecommendations = recommendationsData.map(rec => ({
            ...rec,
            plot_name: plotsData.find(p => p.id === rec.plot_id)?.plot_name || 'Unknown Plot'
          }));
          saveToCache(CACHE_KEYS.CROP_RECOMMENDATIONS, enrichedRecommendations);
        }

        // Get recent disease detections (last 10)
        const { data: detectionsData } = await supabase
          .from('disease_detections')
          .select(`
            id, image_url, detected_disease, severity, confidence_score,
            treatment_recommendations, prevention_tips, language, analyzed_at, created_at
          `)
          .eq('farmer_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (detectionsData) {
          saveToCache(CACHE_KEYS.DISEASE_DETECTIONS, detectionsData);
        }

        // Update last sync time
        const now = new Date().toISOString();
        saveToCache(CACHE_KEYS.LAST_SYNC, now);

        // Update state
        setCache({
          farmerProfile: profileData,
          plots: plotsData || [],
          cropRecommendations: recommendationsData ? recommendationsData.map(rec => ({
            ...rec,
            plot_name: plotsData?.find(p => p.id === rec.plot_id)?.plot_name || 'Unknown Plot'
          })) : [],
          diseaseDetections: detectionsData || [],
          lastSync: new Date(now),
        });
      }
    } catch (error) {
      console.error('Failed to sync offline cache:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline]);

  // Manual refresh
  const refreshCache = useCallback(async () => {
    setIsLoading(true);
    await syncFromServer();
    setIsLoading(false);
  }, [syncFromServer]);

  // Clear all cached data
  const clearCache = useCallback(() => {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setCache({
      cropRecommendations: [],
      diseaseDetections: [],
      farmerProfile: null,
      plots: [],
      lastSync: null,
    });
  }, []);

  return {
    ...cache,
    isOnline,
    isLoading,
    isSyncing,
    refreshCache,
    clearCache,
    hasOfflineData: cache.cropRecommendations.length > 0 || cache.diseaseDetections.length > 0,
  };
}
