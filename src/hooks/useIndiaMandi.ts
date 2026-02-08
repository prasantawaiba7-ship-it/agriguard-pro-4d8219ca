import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
}

interface FetchParams {
  state?: string;
  district?: string;
  commodity?: string;
  limit?: number;
}

// Major Indian states for agriculture
export const indianStates = [
  { name: 'Andhra Pradesh', nameHi: 'आंध्र प्रदेश' },
  { name: 'Bihar', nameHi: 'बिहार' },
  { name: 'Gujarat', nameHi: 'गुजरात' },
  { name: 'Haryana', nameHi: 'हरियाणा' },
  { name: 'Karnataka', nameHi: 'कर्नाटक' },
  { name: 'Madhya Pradesh', nameHi: 'मध्य प्रदेश' },
  { name: 'Maharashtra', nameHi: 'महाराष्ट्र' },
  { name: 'Punjab', nameHi: 'पंजाब' },
  { name: 'Rajasthan', nameHi: 'राजस्थान' },
  { name: 'Tamil Nadu', nameHi: 'तमिल नाडु' },
  { name: 'Telangana', nameHi: 'तेलंगाना' },
  { name: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश' },
  { name: 'West Bengal', nameHi: 'पश्चिम बंगाल' },
];

export function useIndiaMandi() {
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async (params: FetchParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-india-mandi-prices', {
        body: params,
      });

      if (fnError) throw fnError;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prices');
      }

      setPrices(data.prices || []);
      return data.prices;
    } catch (err) {
      console.error('Error fetching India mandi prices:', err);
      setError('मंडी भाव लोड करने में विफल');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get unique states from current prices
  const uniqueStates = [...new Set(prices.map(p => p.state))].sort();
  
  // Get unique districts for a state
  const getDistrictsForState = useCallback((state: string) => {
    return [...new Set(prices.filter(p => p.state === state).map(p => p.district))].sort();
  }, [prices]);

  // Get unique commodities
  const uniqueCommodities = [...new Set(prices.map(p => p.commodity))].sort();

  return {
    prices,
    isLoading,
    error,
    fetchPrices,
    uniqueStates,
    uniqueCommodities,
    getDistrictsForState,
    indianStates,
  };
}
