import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, MessageCircle, Navigation, Store, Loader2, AlertCircle } from 'lucide-react';
import { useNearestMarkets, Market } from '@/hooks/useNearestMarkets';
import { useLocationData } from '@/hooks/useLocationData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/hooks/useLanguage';

const MARKET_TYPES = [
  { value: 'all', label: 'सबै', labelEn: 'All' },
  { value: 'wholesale', label: 'थोक बजार', labelEn: 'Wholesale' },
  { value: 'retail', label: 'खुद्रा बजार', labelEn: 'Retail' },
  { value: 'cooperative', label: 'सहकारी बजार', labelEn: 'Cooperative' },
  { value: 'haat', label: 'हाट बजार', labelEn: 'Haat' },
];

export const NearestMarketsSection = () => {
  const { language } = useLanguage();
  const isNepali = language === 'ne';
  
  const { markets, isLoading, error, findNearestMarkets } = useNearestMarkets();
  const { 
    provinces, 
    districts, 
    localLevels, 
    handleProvinceChange, 
    handleDistrictChange, 
    handleLocalLevelChange 
  } = useLocationData();
  const { 
    latitude: gpsLat, 
    longitude: gpsLng, 
    isLoading: gpsLoading, 
    error: gpsError, 
    fetchLocation 
  } = useGeolocation();
  
  const [useGPS, setUseGPS] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedLocalLevel, setSelectedLocalLevel] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [marketTypeFilter, setMarketTypeFilter] = useState<string>('all');
  const [hasSearched, setHasSearched] = useState(false);

  // Handle province change
  useEffect(() => {
    if (selectedProvince) {
      handleProvinceChange(Number(selectedProvince));
      setSelectedDistrict('');
      setSelectedLocalLevel('');
    }
  }, [selectedProvince, handleProvinceChange]);

  // Handle district change
  useEffect(() => {
    if (selectedDistrict) {
      handleDistrictChange(Number(selectedDistrict));
      setSelectedLocalLevel('');
    }
  }, [selectedDistrict, handleDistrictChange]);

  // Handle local level change
  useEffect(() => {
    if (selectedLocalLevel) {
      handleLocalLevelChange(Number(selectedLocalLevel));
    }
  }, [selectedLocalLevel, handleLocalLevelChange]);

  // Request GPS location when toggle is enabled
  useEffect(() => {
    if (useGPS) {
      fetchLocation();
    }
  }, [useGPS, fetchLocation]);

  const handleSearch = async () => {
    setHasSearched(true);
    
    if (useGPS && gpsLat && gpsLng) {
      await findNearestMarkets({
        latitude: gpsLat,
        longitude: gpsLng,
      });
    } else {
      await findNearestMarkets({
        provinceId: selectedProvince ? Number(selectedProvince) : null,
        districtId: selectedDistrict ? Number(selectedDistrict) : null,
        localLevelId: selectedLocalLevel ? Number(selectedLocalLevel) : null,
        wardNumber: selectedWard ? Number(selectedWard) : null,
      });
    }
  };

  const filteredMarkets = marketTypeFilter === 'all' 
    ? markets 
    : markets.filter(m => m.market_type === marketTypeFilter);

  const getMarketTypeLabel = (type: string) => {
    const found = MARKET_TYPES.find(t => t.value === type);
    return isNepali ? found?.label : found?.labelEn;
  };

  const getMarketTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'wholesale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'retail': return 'bg-green-100 text-green-800 border-green-200';
      case 'cooperative': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'haat': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {isNepali ? 'तपाईंको स्थान छान्नुहोस्' : 'Select Your Location'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GPS Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <Label htmlFor="use-gps" className="text-sm">
                {isNepali ? 'मोबाइल स्थान प्रयोग गर्ने' : 'Use Mobile Location'}
              </Label>
            </div>
            <Switch
              id="use-gps"
              checked={useGPS}
              onCheckedChange={setUseGPS}
            />
          </div>

          {useGPS && gpsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isNepali ? 'स्थान प्राप्त गर्दै...' : 'Getting location...'}
            </div>
          )}

          {useGPS && gpsLat && gpsLng && (
            <div className="text-sm text-green-600">
              ✓ {isNepali ? 'स्थान प्राप्त भयो' : 'Location acquired'} ({gpsLat.toFixed(4)}, {gpsLng.toFixed(4)})
            </div>
          )}

          {useGPS && gpsError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {gpsError}
            </div>
          )}

          {/* Manual Location Selection */}
          {!useGPS && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {isNepali ? 'प्रदेश' : 'Province'}
                </Label>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger>
                    <SelectValue placeholder={isNepali ? 'प्रदेश छान्नुहोस्' : 'Select Province'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {provinces.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {isNepali ? p.name_ne : p.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {isNepali ? 'जिल्ला' : 'District'}
                </Label>
                <Select 
                  value={selectedDistrict} 
                  onValueChange={setSelectedDistrict}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isNepali ? 'जिल्ला छान्नुहोस्' : 'Select District'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {districts.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {isNepali ? d.name_ne : d.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {isNepali ? 'नगरपालिका/गाउँपालिका' : 'Local Level'}
                </Label>
                <Select 
                  value={selectedLocalLevel} 
                  onValueChange={setSelectedLocalLevel}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isNepali ? 'पालिका छान्नुहोस्' : 'Select Local Level'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {localLevels.map(l => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {isNepali ? l.name_ne : l.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  {isNepali ? 'वडा नम्बर' : 'Ward Number'}
                </Label>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger>
                    <SelectValue placeholder={isNepali ? 'वडा छान्नुहोस्' : 'Select Ward'} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {Array.from({ length: 33 }, (_, i) => i + 1).map(ward => (
                      <SelectItem key={ward} value={String(ward)}>
                        {isNepali ? `वडा ${ward}` : `Ward ${ward}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full"
            disabled={isLoading || (!useGPS && !selectedProvince) || (useGPS && !gpsLat)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isNepali ? 'खोज्दै...' : 'Searching...'}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                {isNepali ? 'नजिकको बजार खोज्नुहोस्' : 'Find Nearest Markets'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Market Type Filter */}
      {hasSearched && markets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {MARKET_TYPES.map(type => (
            <Button
              key={type.value}
              variant={marketTypeFilter === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMarketTypeFilter(type.value)}
            >
              {isNepali ? type.label : type.labelEn}
            </Button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Markets List */}
      {hasSearched && !isLoading && (
        <div className="space-y-3">
          {filteredMarkets.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isNepali ? 'कुनै बजार भेटिएन।' : 'No markets found.'}</p>
                <p className="text-sm mt-1">
                  {isNepali ? 'अर्को स्थान वा फिल्टर प्रयोग गर्नुहोस्।' : 'Try a different location or filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMarkets.map((market, index) => (
              <MarketCard 
                key={market.id} 
                market={market} 
                rank={index + 1}
                isNepali={isNepali}
                getMarketTypeLabel={getMarketTypeLabel}
                getMarketTypeBadgeColor={getMarketTypeBadgeColor}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface MarketCardProps {
  market: Market;
  rank: number;
  isNepali: boolean;
  getMarketTypeLabel: (type: string) => string | undefined;
  getMarketTypeBadgeColor: (type: string) => string;
}

const MarketCard = ({ market, rank, isNepali, getMarketTypeLabel, getMarketTypeBadgeColor }: MarketCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            {/* Market Name & Type */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {isNepali ? market.name_ne : market.name_en}
                </h3>
                {market.address_ne && (
                  <p className="text-sm text-muted-foreground truncate">
                    {isNepali ? market.address_ne : market.address}
                  </p>
                )}
              </div>
              <Badge className={`flex-shrink-0 text-xs ${getMarketTypeBadgeColor(market.market_type)}`}>
                {getMarketTypeLabel(market.market_type)}
              </Badge>
            </div>

            {/* Distance (if available) */}
            {market.distance !== undefined && (
              <div className="flex items-center gap-1 text-sm text-primary mb-2">
                <Navigation className="h-3 w-3" />
                <span>
                  {isNepali ? 'करिब' : 'Approx.'} {market.distance.toFixed(1)} km
                </span>
              </div>
            )}

            {/* Popular Products */}
            {market.popular_products && market.popular_products.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {market.popular_products.slice(0, 4).map((product, i) => (
                  <span 
                    key={i} 
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {product}
                  </span>
                ))}
              </div>
            )}

            {/* Contact Buttons */}
            <div className="flex gap-2">
              {market.contact_phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`tel:${market.contact_phone}`, '_self')}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  {isNepali ? 'कल गर्नुहोस्' : 'Call'}
                </Button>
              )}
              {market.contact_whatsapp && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(`https://wa.me/${market.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
