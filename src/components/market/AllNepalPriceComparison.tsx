import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Store, 
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
  Filter
} from 'lucide-react';
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
  source: string | null;
}

interface ProvinceName {
  id: number;
  name_ne: string;
  name_en: string;
}

interface DistrictInfo {
  id: number;
  name_ne: string;
  name_en: string;
  province_id: number;
  is_major: boolean;
}

export function AllNepalPriceComparison() {
  const { language } = useLanguage();
  const isNepali = language === 'ne';
  const { crops } = useCrops();
  
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [prices, setPrices] = useState<MarketPriceRow[]>([]);
  const [provinces, setProvinces] = useState<ProvinceName[]>([]);
  const [districts, setDistricts] = useState<DistrictInfo[]>([]);
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [showMajorOnly, setShowMajorOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'market'>('price-low');
  const [latestDate, setLatestDate] = useState<string>('');
  const [districtsWithoutData, setDistrictsWithoutData] = useState<DistrictInfo[]>([]);

  // Fetch provinces and districts
  useEffect(() => {
    Promise.all([
      supabase.from('provinces').select('id, name_ne, name_en').order('display_order'),
      supabase.from('districts').select('id, name_ne, name_en, province_id, is_major').order('name_en'),
    ]).then(([provRes, distRes]) => {
      if (provRes.data) setProvinces(provRes.data);
      if (distRes.data) setDistricts(distRes.data);
    });
  }, []);

  // Fetch prices when crop changes
  useEffect(() => {
    if (!selectedCropId) {
      setPrices([]);
      setDistrictsWithoutData([]);
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

        // Find districts without data for this crop
        const districtsWithData = new Set((data || []).map(p => p.district));
        const missing = districts.filter(d => !districtsWithData.has(d.name_en) && !districtsWithData.has(d.name_ne));
        setDistrictsWithoutData(missing);

      } catch (e) {
        console.error('Error fetching comparison data:', e);
        setPrices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, [selectedCropId, districts]);

  // Filter prices
  const filteredPrices = prices.filter(price => {
    if (selectedProvinceFilter !== 'all' && price.province_id !== Number(selectedProvinceFilter)) {
      return false;
    }
    if (showMajorOnly) {
      const district = districts.find(d => d.name_en === price.district || d.name_ne === price.district);
      if (!district?.is_major) return false;
    }
    return true;
  });

  // Sort prices
  const sortedPrices = [...filteredPrices].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.price_avg || 0) - (b.price_avg || 0);
    } else if (sortBy === 'price-high') {
      return (b.price_avg || 0) - (a.price_avg || 0);
    } else {
      return (a.market_name || '').localeCompare(b.market_name || '');
    }
  });

  // Find min and max prices from filtered data
  const minPrice = filteredPrices.length > 0 
    ? Math.min(...filteredPrices.filter(p => p.price_avg).map(p => p.price_avg!))
    : 0;
  const maxPrice = filteredPrices.length > 0 
    ? Math.max(...filteredPrices.filter(p => p.price_avg).map(p => p.price_avg!))
    : 0;

  const getProvinceName = (provinceId: number | null) => {
    if (!provinceId) return '';
    const province = provinces.find(p => p.id === provinceId);
    return isNepali ? province?.name_ne : province?.name_en;
  };

  const selectedCrop = crops.find(c => c.id === Number(selectedCropId));

  // Filter missing districts by province
  const filteredMissingDistricts = districtsWithoutData.filter(d => {
    if (selectedProvinceFilter !== 'all' && d.province_id !== Number(selectedProvinceFilter)) {
      return false;
    }
    if (showMajorOnly && !d.is_major) return false;
    return true;
  });

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
              <div className="flex-1">
                <h3 className="font-semibold">
                  {isNepali ? selectedCrop.name_ne : selectedCrop.name_en}
                </h3>
                {latestDate && (
                  <p className="text-sm text-muted-foreground">
                    {isNepali ? 'मिति' : 'Date'}: {format(new Date(latestDate), 'yyyy-MM-dd')}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setIsLoading(true);
                  // Re-trigger fetch
                  const cropId = selectedCropId;
                  setSelectedCropId('');
                  setTimeout(() => setSelectedCropId(cropId), 100);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Filters */}
          {selectedCropId && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedProvinceFilter} onValueChange={setSelectedProvinceFilter}>
                <SelectTrigger className="w-32 h-8 text-xs bg-card">
                  <SelectValue placeholder="प्रदेश" />
                </SelectTrigger>
                <SelectContent className="bg-card border z-50">
                  <SelectItem value="all">{isNepali ? 'सबै प्रदेश' : 'All Provinces'}</SelectItem>
                  {provinces.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {isNepali ? p.name_ne : p.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showMajorOnly ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowMajorOnly(!showMajorOnly)}
              >
                {isNepali ? 'प्रमुख जिल्ला मात्र' : 'Major Districts Only'}
              </Button>
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
          ) : filteredPrices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-2">
                  {isNepali ? 'यस बालीको मूल्य डाटा उपलब्ध छैन।' : 'No price data available for this crop.'}
                </p>
                <p className="text-sm">
                  {isNepali 
                    ? 'AMPIS/कालीमाटी API जडान भएपछि स्वचालित अपडेट हुनेछ।'
                    : 'Data will update automatically when AMPIS/Kalimati API is connected.'}
                </p>
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
                  {filteredPrices.length} {isNepali ? 'बजार' : 'markets'}
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                {price.source && price.source !== 'manual' && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    {price.source.toUpperCase()}
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

              {/* Districts Without Data */}
              {filteredMissingDistricts.length > 0 && (
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-warning mb-2">
                          {isNepali 
                            ? `${filteredMissingDistricts.length} जिल्लाको लागि आजको मूल्य उपलब्ध छैन`
                            : `No data available for ${filteredMissingDistricts.length} districts`}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredMissingDistricts.slice(0, 10).map(d => (
                            <Badge key={d.id} variant="outline" className="text-xs">
                              {isNepali ? d.name_ne : d.name_en}
                            </Badge>
                          ))}
                          {filteredMissingDistricts.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{filteredMissingDistricts.length - 10} {isNepali ? 'थप' : 'more'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
