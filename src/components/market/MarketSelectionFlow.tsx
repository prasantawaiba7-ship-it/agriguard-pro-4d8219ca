import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Store, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useLanguage } from '@/hooks/useLanguage';
import { useUserSelectedMarket, SelectedMarket } from '@/hooks/useUserSelectedMarket';
import { supabase } from '@/integrations/supabase/client';

interface Market {
  id: string;
  name_ne: string;
  name_en: string;
  market_type: string;
  market_code: string | null;
}

interface MarketSelectionFlowProps {
  onMarketSelected?: (market: SelectedMarket) => void;
  showCurrentSelection?: boolean;
}

export function MarketSelectionFlow({ onMarketSelected, showCurrentSelection = true }: MarketSelectionFlowProps) {
  const { language } = useLanguage();
  const isNepali = language === 'ne';
  
  const { 
    provinces, 
    districts, 
    handleProvinceChange, 
    handleDistrictChange 
  } = useLocationData();
  
  const { selectedMarket, saveMarket, isLoading: savedMarketLoading } = useUserSelectedMarket();
  
  const [step, setStep] = useState<'province' | 'district' | 'market' | 'done'>('province');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // If user has a saved market, show it
  useEffect(() => {
    if (selectedMarket && !isChanging) {
      setStep('done');
    }
  }, [selectedMarket, isChanging]);

  // Handle province change
  useEffect(() => {
    if (selectedProvince) {
      handleProvinceChange(Number(selectedProvince));
      setSelectedDistrict('');
      setMarkets([]);
    }
  }, [selectedProvince, handleProvinceChange]);

  // Handle district change - fetch markets
  useEffect(() => {
    if (selectedDistrict) {
      handleDistrictChange(Number(selectedDistrict));
      fetchMarkets(Number(selectedDistrict));
    }
  }, [selectedDistrict, handleDistrictChange]);

  const fetchMarkets = async (districtId: number) => {
    setMarketsLoading(true);
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id, name_ne, name_en, market_type, market_code')
        .eq('district_id', districtId)
        .eq('is_active', true)
        .order('name_ne');

      if (!error && data) {
        setMarkets(data);
      }
    } catch (e) {
      console.error('Error fetching markets:', e);
    } finally {
      setMarketsLoading(false);
    }
  };

  const handleMarketSelect = async (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    const district = districts.find(d => d.id === Number(selectedDistrict));
    const province = provinces.find(p => p.id === Number(selectedProvince));
    
    if (market && district && province) {
      const selection: SelectedMarket = {
        marketId: market.id,
        marketCode: market.market_code || '',
        marketNameNe: market.name_ne,
        marketNameEn: market.name_en,
        districtId: district.id,
        districtNameNe: district.name_ne,
        districtNameEn: district.name_en,
        provinceId: province.id,
        provinceNameNe: province.name_ne,
      };
      
      saveMarket(selection);
      setStep('done');
      setIsChanging(false);
      onMarketSelected?.(selection);
    }
  };

  const handleChangeMarket = () => {
    setIsChanging(true);
    setStep('province');
    setSelectedProvince('');
    setSelectedDistrict('');
    setMarkets([]);
  };

  // Show current selection
  if (step === 'done' && selectedMarket && showCurrentSelection) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isNepali ? 'तपाईंको बजार' : 'Your Market'}
                </p>
                <h3 className="font-semibold text-foreground">
                  {isNepali ? selectedMarket.marketNameNe : selectedMarket.marketNameEn}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isNepali ? selectedMarket.districtNameNe : selectedMarket.districtNameEn}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleChangeMarket}>
              {isNepali ? 'बदल्नुहोस्' : 'Change'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          {isNepali ? 'तपाईंको ठाउँ छान्नुहोस्' : 'Select Your Location'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={step === 'province' || selectedProvince ? 'default' : 'secondary'} className="gap-1">
            {selectedProvince && <Check className="h-3 w-3" />}
            1. {isNepali ? 'प्रदेश' : 'Province'}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step === 'district' || selectedDistrict ? 'default' : 'secondary'} className="gap-1">
            {selectedDistrict && <Check className="h-3 w-3" />}
            2. {isNepali ? 'जिल्ला' : 'District'}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step === 'market' ? 'default' : 'secondary'}>
            3. {isNepali ? 'बजार' : 'Market'}
          </Badge>
        </div>

        {/* Step 1: Province */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">
            {isNepali ? 'प्रदेश छान्नुहोस्' : 'Select Province'}
          </Label>
          <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v); setStep('district'); }}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder={isNepali ? 'प्रदेश...' : 'Province...'} />
            </SelectTrigger>
            <SelectContent className="bg-card border z-50">
              {provinces.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {isNepali ? p.name_ne : p.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: District */}
        {selectedProvince && (
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              {isNepali ? 'जिल्ला छान्नुहोस्' : 'Select District'}
            </Label>
            <Select value={selectedDistrict} onValueChange={(v) => { setSelectedDistrict(v); setStep('market'); }}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder={isNepali ? 'जिल्ला...' : 'District...'} />
              </SelectTrigger>
              <SelectContent className="bg-card border z-50 max-h-60">
                {districts.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {isNepali ? d.name_ne : d.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 3: Market */}
        {selectedDistrict && (
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">
              {isNepali ? 'बजार छान्नुहोस्' : 'Select Market'}
            </Label>
            {marketsLoading ? (
              <div className="flex items-center gap-2 p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isNepali ? 'बजारहरू लोड हुँदैछ...' : 'Loading markets...'}
              </div>
            ) : markets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
                {isNepali ? 'यस जिल्लामा बजार छैन।' : 'No markets in this district.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {markets.map(market => (
                  <Button
                    key={market.id}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-3"
                    onClick={() => handleMarketSelect(market.id)}
                  >
                    <Store className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">
                        {isNepali ? market.name_ne : market.name_en}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {market.market_type === 'wholesale' ? (isNepali ? 'थोक बजार' : 'Wholesale') : 
                         market.market_type === 'retail' ? (isNepali ? 'खुद्रा' : 'Retail') : 
                         market.market_type}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
