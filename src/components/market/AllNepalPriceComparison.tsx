import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Globe, TrendingUp, TrendingDown, MapPin, Store, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { useCrops } from '@/hooks/useCrops';
import { getCropImageUrl, handleCropImageError } from '@/lib/cropPlaceholder';
import { format } from 'date-fns';

interface MarketPriceRow {
  id: string;
  date: string;
  crop_id: number | null;
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
  province_id: number | null;
}

interface ProvinceName {
  id: number;
  name_ne: string;
  name_en: string;
}

export function AllNepalPriceComparison() {
  const { language } = useLanguage();
  const isNepali = language === 'ne';
  const { crops } = useCrops();
  
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [prices, setPrices] = useState<MarketPriceRow[]>([]);
  const [provinces, setProvinces] = useState<ProvinceName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'market'>('price-low');
  const [latestDate, setLatestDate] = useState<string>('');

  // Fetch provinces
  useEffect(() => {
    supabase
      .from('provinces')
      .select('id, name_ne, name_en')
      .order('display_order')
      .then(({ data }) => {
        if (data) setProvinces(data);
      });
  }, []);

  // Fetch prices when crop changes
  useEffect(() => {
    if (!selectedCropId) {
      setPrices([]);
      return;
    }

    const fetchPrices = async () => {
      setIsLoading(true);
      try {
        // Get latest date
        const { data: dateData } = await supabase
          .from('daily_market_products')
          .select('date')
          .order('date', { ascending: false })
          .limit(1);

        if (!dateData || dateData.length === 0) {
          setPrices([]);
          return;
        }

        const targetDate = dateData[0].date;
        setLatestDate(targetDate);

        // Fetch all markets for this crop on this date
        const { data, error } = await supabase
          .from('daily_market_products')
          .select('*')
          .eq('date', targetDate)
          .eq('crop_id', Number(selectedCropId));

        if (error) throw error;
        setPrices(data || []);
      } catch (e) {
        console.error('Error fetching comparison data:', e);
        setPrices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedCropId]);

  // Sort prices
  const sortedPrices = [...prices].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.price_avg || 0) - (b.price_avg || 0);
    } else if (sortBy === 'price-high') {
      return (b.price_avg || 0) - (a.price_avg || 0);
    } else {
      return (a.market_name || '').localeCompare(b.market_name || '');
    }
  });

  // Find min and max prices
  const minPrice = prices.length > 0 
    ? Math.min(...prices.filter(p => p.price_avg).map(p => p.price_avg!))
    : 0;
  const maxPrice = prices.length > 0 
    ? Math.max(...prices.filter(p => p.price_avg).map(p => p.price_avg!))
    : 0;

  const getProvinceName = (provinceId: number | null) => {
    if (!provinceId) return '';
    const province = provinces.find(p => p.id === provinceId);
    return isNepali ? province?.name_ne : province?.name_en;
  };

  const selectedCrop = crops.find(c => c.id === Number(selectedCropId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            {isNepali ? 'नेपालभरिको मूल्य तुलना' : 'All-Nepal Price Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Crop Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              {isNepali ? 'बाली छान्नुहोस्' : 'Select Crop'}
            </label>
            <Select value={selectedCropId} onValueChange={setSelectedCropId}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder={isNepali ? 'बाली छान्नुहोस्...' : 'Select crop...'} />
              </SelectTrigger>
              <SelectContent className="bg-card border z-50 max-h-60">
                {crops.filter(c => c.is_active).map(crop => (
                  <SelectItem key={crop.id} value={String(crop.id)}>
                    <span className="flex items-center gap-2">
                      {isNepali ? crop.name_ne : crop.name_en}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Crop Info */}
          {selectedCrop && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                <img
                  src={getCropImageUrl(selectedCrop.image_url)}
                  alt={selectedCrop.name_ne}
                  className="w-full h-full object-cover"
                  onError={handleCropImageError}
                />
              </div>
              <div>
                <h3 className="font-semibold">
                  {isNepali ? selectedCrop.name_ne : selectedCrop.name_en}
                </h3>
                {latestDate && (
                  <p className="text-sm text-muted-foreground">
                    {isNepali ? 'मिति' : 'Date'}: {format(new Date(latestDate), 'yyyy-MM-dd')}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {selectedCropId && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : prices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isNepali ? 'यस बालीको मूल्य डाटा उपलब्ध छैन।' : 'No price data available for this crop.'}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 text-center">
                    <TrendingDown className="h-5 w-5 mx-auto mb-1 text-success" />
                    <p className="text-xs text-muted-foreground mb-1">
                      {isNepali ? 'सबैभन्दा कम' : 'Lowest'}
                    </p>
                    <p className="text-xl font-bold text-success">रु. {minPrice}</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-destructive" />
                    <p className="text-xs text-muted-foreground mb-1">
                      {isNepali ? 'सबैभन्दा बढी' : 'Highest'}
                    </p>
                    <p className="text-xl font-bold text-destructive">रु. {maxPrice}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-40 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border z-50">
                    <SelectItem value="price-low">{isNepali ? 'कम → बढी' : 'Low → High'}</SelectItem>
                    <SelectItem value="price-high">{isNepali ? 'बढी → कम' : 'High → Low'}</SelectItem>
                    <SelectItem value="market">{isNepali ? 'बजार नाम' : 'Market Name'}</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground ml-auto">
                  {prices.length} {isNepali ? 'बजार' : 'markets'}
                </span>
              </div>

              {/* Price List */}
              <div className="space-y-2">
                {sortedPrices.map((price, index) => {
                  const isLowest = price.price_avg === minPrice;
                  const isHighest = price.price_avg === maxPrice;
                  
                  return (
                    <Card 
                      key={price.id} 
                      className={`
                        ${isLowest ? 'border-success/50 bg-success/5' : ''}
                        ${isHighest ? 'border-destructive/50 bg-destructive/5' : ''}
                      `}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {isNepali ? price.market_name_ne : price.market_name}
                                </span>
                                {isLowest && (
                                  <Badge variant="outline" className="text-success border-success/50 text-xs">
                                    {isNepali ? 'सस्तो' : 'Cheapest'}
                                  </Badge>
                                )}
                                {isHighest && (
                                  <Badge variant="outline" className="text-destructive border-destructive/50 text-xs">
                                    {isNepali ? 'महँगो' : 'Highest'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {price.district}
                                {price.province_id && (
                                  <span> • {getProvinceName(price.province_id)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${isLowest ? 'text-success' : isHighest ? 'text-destructive' : 'text-primary'}`}>
                              रु. {price.price_avg?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              / {price.unit}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
