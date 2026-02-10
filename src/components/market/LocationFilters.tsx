import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';
import { useLocationData } from '@/hooks/useLocationData';
import { useCrops } from '@/hooks/useCrops';
import { useLanguage } from '@/hooks/useLanguage';

interface LocationFiltersProps {
  selectedCropId: number | null;
  onCropChange: (cropId: number | null) => void;
  onFiltersChange: (filters: {
    provinceId: number | null;
    districtId: number | null;
    localLevelId: number | null;
    wardNumber: number | null;
  }) => void;
}

export function LocationFilters({ selectedCropId, onCropChange, onFiltersChange }: LocationFiltersProps) {
  const { t, language } = useLanguage();
  const isNepali = language === 'ne';

  const {
    provinces,
    districts,
    localLevels,
    availableWards,
    selectedProvinceId,
    selectedDistrictId,
    selectedLocalLevelId,
    selectedWardNumber,
    handleProvinceChange,
    handleDistrictChange,
    handleLocalLevelChange,
    handleWardChange,
    resetFilters,
    isLoading,
  } = useLocationData();

  const { activeCrops, isLoading: cropsLoading } = useCrops();

  const handleProvinceSelect = (value: string) => {
    const id = value === 'all' ? null : parseInt(value);
    handleProvinceChange(id);
    onFiltersChange({ provinceId: id, districtId: null, localLevelId: null, wardNumber: null });
  };

  const handleDistrictSelect = (value: string) => {
    const id = value === 'all' ? null : parseInt(value);
    handleDistrictChange(id);
    onFiltersChange({ provinceId: selectedProvinceId, districtId: id, localLevelId: null, wardNumber: null });
  };

  const handleLocalLevelSelect = (value: string) => {
    const id = value === 'all' ? null : parseInt(value);
    handleLocalLevelChange(id);
    onFiltersChange({ provinceId: selectedProvinceId, districtId: selectedDistrictId, localLevelId: id, wardNumber: null });
  };

  const handleWardSelect = (value: string) => {
    const num = value === 'all' ? null : parseInt(value);
    handleWardChange(num);
    onFiltersChange({ provinceId: selectedProvinceId, districtId: selectedDistrictId, localLevelId: selectedLocalLevelId, wardNumber: num });
  };

  const handleCropSelect = (value: string) => {
    onCropChange(value === 'all' ? null : parseInt(value));
  };

  const handleReset = () => {
    resetFilters();
    onCropChange(null);
    onFiltersChange({ provinceId: null, districtId: null, localLevelId: null, wardNumber: null });
  };

  const hasActiveFilters = selectedProvinceId || selectedDistrictId || selectedLocalLevelId || selectedWardNumber || selectedCropId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span>{t('selectLocationAndCrop')}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Select 
          value={selectedProvinceId?.toString() || 'all'} 
          onValueChange={handleProvinceSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full bg-card border-border/60 rounded-lg">
            <SelectValue placeholder={t('selectProvince')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border shadow-lg z-50">
            <SelectItem value="all">{t('allProvinces')}</SelectItem>
            {provinces.map((province) => (
              <SelectItem key={province.id} value={province.id.toString()}>
                {isNepali ? province.name_ne : province.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedDistrictId?.toString() || 'all'} 
          onValueChange={handleDistrictSelect}
          disabled={!selectedProvinceId || districts.length === 0}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder={t('selectDistrict')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="all">{t('allDistricts')}</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district.id} value={district.id.toString()}>
                {isNepali ? district.name_ne : district.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedLocalLevelId?.toString() || 'all'} 
          onValueChange={handleLocalLevelSelect}
          disabled={!selectedDistrictId || localLevels.length === 0}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder={t('selectLocalLevel')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="all">{t('allLocalLevels')}</SelectItem>
            {localLevels.map((ll) => (
              <SelectItem key={ll.id} value={ll.id.toString()}>
                {isNepali ? ll.name_ne : ll.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedWardNumber?.toString() || 'all'} 
          onValueChange={handleWardSelect}
          disabled={!selectedLocalLevelId || availableWards.length === 0}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder={t('selectWard')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="all">{t('allWards')}</SelectItem>
            {availableWards.map((ward) => (
              <SelectItem key={ward} value={ward.toString()}>
                {t('wardNo')} {ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedCropId?.toString() || 'all'} 
          onValueChange={handleCropSelect}
          disabled={cropsLoading}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder={t('selectCrop')} />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50 max-h-64">
            <SelectItem value="all">{t('allCrops')}</SelectItem>
            {activeCrops.map((crop) => (
              <SelectItem key={crop.id} value={crop.id.toString()}>
                {isNepali ? crop.name_ne : crop.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            {t('clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}
