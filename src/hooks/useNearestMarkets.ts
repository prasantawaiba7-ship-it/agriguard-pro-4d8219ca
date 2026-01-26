import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Market {
  id: string;
  name_en: string;
  name_ne: string;
  province_id: number | null;
  district_id: number | null;
  local_level_id: number | null;
  ward_number: number | null;
  latitude: number | null;
  longitude: number | null;
  market_type: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  popular_products: string[] | null;
  address: string | null;
  address_ne: string | null;
  is_active: boolean;
  distance?: number; // calculated distance in km
}

interface LocationParams {
  latitude?: number | null;
  longitude?: number | null;
  provinceId?: number | null;
  districtId?: number | null;
  localLevelId?: number | null;
  wardNumber?: number | null;
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useNearestMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearestMarkets = useCallback(async (params: LocationParams, limit: number = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const { latitude, longitude, provinceId, districtId, localLevelId, wardNumber } = params;

      // Fetch all active markets
      const { data: allMarkets, error: fetchError } = await supabase
        .from('markets')
        .select('*')
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      if (!allMarkets || allMarkets.length === 0) {
        setMarkets([]);
        return [];
      }

      let sortedMarkets: Market[] = allMarkets as Market[];

      // If GPS coordinates are available, calculate distances
      if (latitude && longitude) {
        sortedMarkets = allMarkets
          .filter(m => m.latitude && m.longitude)
          .map(market => ({
            ...market,
            distance: calculateDistance(
              latitude,
              longitude,
              market.latitude!,
              market.longitude!
            )
          }))
          .sort((a, b) => (a.distance || 0) - (b.distance || 0)) as Market[];
      } else {
        // Filter by administrative hierarchy
        // Priority: same ward > same local level > same district > same province
        
        let filtered: Market[] = [];
        
        // Try same ward first
        if (localLevelId && wardNumber) {
          filtered = allMarkets.filter(m => 
            m.local_level_id === localLevelId && m.ward_number === wardNumber
          ) as Market[];
        }
        
        // If no results, try same local level
        if (filtered.length === 0 && localLevelId) {
          filtered = allMarkets.filter(m => m.local_level_id === localLevelId) as Market[];
        }
        
        // If no results, try same district
        if (filtered.length === 0 && districtId) {
          filtered = allMarkets.filter(m => m.district_id === districtId) as Market[];
        }
        
        // If no results, try same province
        if (filtered.length === 0 && provinceId) {
          filtered = allMarkets.filter(m => m.province_id === provinceId) as Market[];
        }
        
        // If still no results, return all markets
        sortedMarkets = filtered.length > 0 ? filtered : allMarkets as Market[];
      }

      const result = sortedMarkets.slice(0, limit);
      setMarkets(result);
      return result;
    } catch (err) {
      console.error('Error finding nearest markets:', err);
      setError('नजिकको बजार खोज्न सकिएन।');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByType = useCallback((type: string | null) => {
    if (!type) return markets;
    return markets.filter(m => m.market_type === type);
  }, [markets]);

  return {
    markets,
    isLoading,
    error,
    findNearestMarkets,
    filterByType,
  };
}
