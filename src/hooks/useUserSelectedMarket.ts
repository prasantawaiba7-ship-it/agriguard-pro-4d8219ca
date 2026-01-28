import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SelectedMarket {
  marketId: string;
  marketCode: string;
  marketNameNe: string;
  marketNameEn: string;
  districtId: number;
  districtNameNe: string;
  districtNameEn: string;
  provinceId: number;
  provinceNameNe: string;
}

const STORAGE_KEY = 'kisan_sathi_selected_market';

export function useUserSelectedMarket() {
  const [selectedMarket, setSelectedMarket] = useState<SelectedMarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelectedMarket(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved market:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save market selection
  const saveMarket = useCallback((market: SelectedMarket) => {
    setSelectedMarket(market);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(market));
  }, []);

  // Clear selection
  const clearMarket = useCallback(() => {
    setSelectedMarket(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Fetch market details by ID and save
  const selectMarketById = useCallback(async (marketId: string) => {
    try {
      const { data: market, error } = await supabase
        .from('markets')
        .select(`
          id,
          market_code,
          name_ne,
          name_en,
          district_id,
          province_id
        `)
        .eq('id', marketId)
        .maybeSingle();

      if (error || !market) return null;

      // Get district and province names
      const [districtRes, provinceRes] = await Promise.all([
        supabase.from('districts').select('name_ne, name_en').eq('id', market.district_id).maybeSingle(),
        supabase.from('provinces').select('name_ne, name_en').eq('id', market.province_id).maybeSingle(),
      ]);

      const marketData: SelectedMarket = {
        marketId: market.id,
        marketCode: market.market_code || '',
        marketNameNe: market.name_ne,
        marketNameEn: market.name_en,
        districtId: market.district_id!,
        districtNameNe: districtRes.data?.name_ne || '',
        districtNameEn: districtRes.data?.name_en || '',
        provinceId: market.province_id!,
        provinceNameNe: provinceRes.data?.name_ne || '',
      };

      saveMarket(marketData);
      return marketData;
    } catch (e) {
      console.error('Error selecting market:', e);
      return null;
    }
  }, [saveMarket]);

  return {
    selectedMarket,
    isLoading,
    saveMarket,
    clearMarket,
    selectMarketById,
  };
}
