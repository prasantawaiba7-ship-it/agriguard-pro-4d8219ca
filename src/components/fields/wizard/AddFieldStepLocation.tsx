import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocationData } from '@/hooks/useLocationData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/hooks/useLanguage';
import { ArrowRight, ArrowLeft, MapPin, Navigation, Loader2 } from 'lucide-react';
import type { WizardFieldData } from '../AddFieldDialog';

interface Props {
  data: WizardFieldData;
  updateData: (partial: Partial<WizardFieldData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const STORAGE_KEY_LOC = 'kisan_last_location';

export function AddFieldStepLocation({ data, updateData, onNext, onBack, onSkip, isSubmitting }: Props) {
  const { t, language } = useLanguage();
  const geo = useGeolocation();

  const localLevelTypeLabels: Record<string, string> = {
    metropolitan: language === 'ne' ? 'महानगरपालिका' : 'Metropolitan',
    sub_metropolitan: language === 'ne' ? 'उपमहानगरपालिका' : 'Sub-Metropolitan',
    municipality: language === 'ne' ? 'नगरपालिका' : 'Municipality',
    rural_municipality: language === 'ne' ? 'गाउँपालिका' : 'Rural Municipality',
  };

  const {
    provinces, districts, localLevels, availableWards,
    selectedProvinceId, selectedDistrictId, selectedLocalLevelId, selectedWardNumber,
    handleProvinceChange, handleDistrictChange, handleLocalLevelChange, handleWardChange,
    isLoading,
  } = useLocationData();

  // Restore last used location on mount
  useEffect(() => {
    if (!data.provinceId) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOC);
        if (saved) {
          const loc = JSON.parse(saved);
          if (loc.provinceId) handleProvinceChange(loc.provinceId);
          // District/local level will cascade after province loads
          setTimeout(() => {
            if (loc.districtId) handleDistrictChange(loc.districtId);
          }, 300);
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Sync location hook state → wizard data
  useEffect(() => {
    const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
    const selectedLocalLevel = localLevels.find(ll => ll.id === selectedLocalLevelId);
    let municipalityString = '';
    if (selectedLocalLevel) {
      municipalityString = selectedLocalLevel.name_ne;
      if (selectedWardNumber) {
        municipalityString += ` ${t('wardNo')} ${selectedWardNumber}`;
      }
    }
    updateData({
      provinceId: selectedProvinceId,
      districtId: selectedDistrictId,
      localLevelId: selectedLocalLevelId,
      wardNumber: selectedWardNumber,
      districtName: selectedDistrict?.name_ne || null,
      municipalityString: municipalityString || null,
    });
  }, [selectedProvinceId, selectedDistrictId, selectedLocalLevelId, selectedWardNumber, districts, localLevels]);

  const handleGPS = () => {
    geo.fetchLocation();
  };

  // When GPS resolves, try to match province/district
  useEffect(() => {
    if (geo.latitude && geo.longitude && geo.locationName) {
      updateData({ latitude: geo.latitude, longitude: geo.longitude });
      // Try to find matching district in list
      const matchedDistrict = districts.find(d =>
        d.name_ne === geo.locationName || d.name_en?.toLowerCase() === geo.locationName?.toLowerCase()
      );
      if (matchedDistrict) {
        handleDistrictChange(matchedDistrict.id);
        // Also set province
        const matchedProvince = provinces.find(p => p.id === matchedDistrict.province_id);
        if (matchedProvince) handleProvinceChange(matchedProvince.id);
      }
    }
  }, [geo.latitude, geo.longitude, geo.locationName]);

  const handleNext = () => {
    // Save location for next time
    if (selectedProvinceId || selectedDistrictId) {
      localStorage.setItem(STORAGE_KEY_LOC, JSON.stringify({
        provinceId: selectedProvinceId,
        districtId: selectedDistrictId,
      }));
    }
    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        {language === 'ne' ? 'स्थान छान्नुस्' : 'Select Location'}
      </div>

      <p className="text-xs text-muted-foreground">
        {language === 'ne'
          ? 'अहिले जहाँ खेती गर्नुहुन्छ, त्यो ठाउँ छान्नुस्।'
          : 'Select the place where your field is located.'}
      </p>

      {/* GPS button */}
      <Button
        variant="outline"
        className="w-full h-11 gap-2 border-primary/30 text-primary hover:bg-primary/5"
        onClick={handleGPS}
        disabled={geo.isLoading}
      >
        {geo.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
        {language === 'ne' ? 'मेरो स्थान प्रयोग गर्ने' : 'Use my location'}
      </Button>

      {geo.locationName && (
        <p className="text-xs text-primary bg-primary/5 rounded-md px-3 py-1.5">
          📍 {geo.locationName}
        </p>
      )}
      {geo.error && (
        <p className="text-xs text-destructive">{geo.error}</p>
      )}

      {/* Dropdowns */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('province')}</Label>
            <Select
              value={selectedProvinceId?.toString() || '_none'}
              onValueChange={(v) => handleProvinceChange(v === '_none' ? null : parseInt(v))}
            >
              <SelectTrigger className="h-10"><SelectValue placeholder={t('selectProvince')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name_ne}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('district')}</Label>
            <Select
              value={selectedDistrictId?.toString() || '_none'}
              onValueChange={(v) => handleDistrictChange(v === '_none' ? null : parseInt(v))}
              disabled={!selectedProvinceId}
            >
              <SelectTrigger className="h-10"><SelectValue placeholder={t('selectDistrict')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name_ne}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{language === 'ne' ? 'स्थानीय तह' : 'Local Level'}</Label>
            <Select
              value={selectedLocalLevelId?.toString() || '_none'}
              onValueChange={(v) => handleLocalLevelChange(v === '_none' ? null : parseInt(v))}
              disabled={!selectedDistrictId}
            >
              <SelectTrigger className="h-10"><SelectValue placeholder={t('selectLocalLevel')} /></SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                {localLevels.map((ll) => (
                  <SelectItem key={ll.id} value={ll.id.toString()}>
                    <span className="flex items-center gap-1.5">
                      {ll.name_ne}
                      <span className="text-[10px] text-muted-foreground">
                        ({localLevelTypeLabels[ll.type] || ll.type})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('ward')}</Label>
            <Select
              value={selectedWardNumber?.toString() || '_none'}
              onValueChange={(v) => handleWardChange(v === '_none' ? null : parseInt(v))}
              disabled={!selectedLocalLevelId}
            >
              <SelectTrigger className="h-10"><SelectValue placeholder={t('selectWard')} /></SelectTrigger>
              <SelectContent className="max-h-48">
                <SelectItem value="_none">{t('choosePlaceholder')}</SelectItem>
                {availableWards.map((w) => (
                  <SelectItem key={w} value={w.toString()}>{t('wardNo')} {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-11 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {language === 'ne' ? 'अघिल्लो' : 'Back'}
        </Button>
        <Button onClick={handleNext} className="flex-1 h-11 gap-2 text-base">
          {language === 'ne' ? 'अर्को (बाली)' : 'Next (Crop)'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1 disabled:opacity-40"
      >
        {language === 'ne' ? 'बाली पछि गर्ने — अहिले सेभ गर्ने' : 'Skip crop — save now'}
      </button>
    </div>
  );
}
