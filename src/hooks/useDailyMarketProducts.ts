import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyMarketProduct {
  id: string;
  date: string;
  crop_name: string;
  crop_name_ne: string | null;
  image_url: string | null;
  unit: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  market_name: string | null;
  market_name_ne: string | null;
  district: string | null;
  source: string | null;
  created_at: string;
}

export function useDailyMarketProducts() {
  const [products, setProducts] = useState<DailyMarketProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [districts, setDistricts] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get the latest date available
      const { data: dateData, error: dateError } = await supabase
        .from('daily_market_products')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

      if (dateError) throw dateError;

      if (!dateData || dateData.length === 0) {
        setProducts([]);
        setLatestDate(null);
        return;
      }

      const targetDate = dateData[0].date;
      setLatestDate(targetDate);

      // Fetch products for that date
      let query = supabase
        .from('daily_market_products')
        .select('*')
        .eq('date', targetDate);

      if (selectedDistrict !== 'all') {
        query = query.eq('district', selectedDistrict);
      }

      if (selectedCrop !== 'all') {
        query = query.eq('crop_name', selectedCrop);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Sort the data
      let sortedData = [...(data || [])];
      if (sortBy === 'name') {
        sortedData.sort((a, b) => (a.crop_name_ne || a.crop_name).localeCompare(b.crop_name_ne || b.crop_name));
      } else if (sortBy === 'price-low') {
        sortedData.sort((a, b) => (a.price_avg || 0) - (b.price_avg || 0));
      } else if (sortBy === 'price-high') {
        sortedData.sort((a, b) => (b.price_avg || 0) - (a.price_avg || 0));
      }

      setProducts(sortedData as DailyMarketProduct[]);

      // Fetch distinct districts and crops for filters
      const { data: allData } = await supabase
        .from('daily_market_products')
        .select('district, crop_name')
        .eq('date', targetDate);

      if (allData) {
        const uniqueDistricts = [...new Set(allData.map(d => d.district).filter(Boolean))] as string[];
        const uniqueCrops = [...new Set(allData.map(d => d.crop_name).filter(Boolean))] as string[];
        setDistricts(uniqueDistricts);
        setCrops(uniqueCrops);
      }
    } catch (err) {
      console.error('Error fetching daily market products:', err);
      setError('बजार मूल्य लोड गर्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDistrict, selectedCrop, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    latestDate,
    districts,
    crops,
    selectedDistrict,
    setSelectedDistrict,
    selectedCrop,
    setSelectedCrop,
    sortBy,
    setSortBy,
    refresh: fetchProducts,
  };
}
