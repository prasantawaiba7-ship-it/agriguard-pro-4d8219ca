import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  nepalProvinces, 
  nepalDistricts, 
  nepalMunicipalities, 
  generateWardOptions 
} from '@/lib/languages';

interface LocationSelectorProps {
  onLocationChange?: (location: {
    province: string;
    district: string;
    municipality: string;
    ward: number | null;
  }) => void;
  initialProvince?: string;
  initialDistrict?: string;
  initialMunicipality?: string;
  initialWard?: number;
  showLabels?: boolean;
  compact?: boolean;
}

export function LocationSelector({
  onLocationChange,
  initialProvince = '',
  initialDistrict = '',
  initialMunicipality = '',
  initialWard,
  showLabels = true,
  compact = false,
}: LocationSelectorProps) {
  const { language } = useLanguage();
  const isNepali = language === 'ne';

  const [province, setProvince] = useState(initialProvince);
  const [district, setDistrict] = useState(initialDistrict);
  const [municipality, setMunicipality] = useState(initialMunicipality);
  const [ward, setWard] = useState<number | null>(initialWard || null);

  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<{ name: string; nepaliName: string; type: 'metro' | 'sub-metro' | 'municipality' | 'rural' }[]>([]);
  const [availableWards, setAvailableWards] = useState<{ value: number; label: string; nepaliLabel: string }[]>([]);

  // Update available districts when province changes
  useEffect(() => {
    if (province) {
      setAvailableDistricts(nepalDistricts[province] || []);
      if (!nepalDistricts[province]?.includes(district)) {
        setDistrict('');
        setMunicipality('');
        setWard(null);
      }
    } else {
      setAvailableDistricts([]);
      setDistrict('');
      setMunicipality('');
      setWard(null);
    }
  }, [province]);

  // Update available municipalities when district changes
  useEffect(() => {
    if (district) {
      setAvailableMunicipalities(nepalMunicipalities[district] || []);
      if (!nepalMunicipalities[district]?.some(m => m.name === municipality)) {
        setMunicipality('');
        setWard(null);
      }
    } else {
      setAvailableMunicipalities([]);
      setMunicipality('');
      setWard(null);
    }
  }, [district]);

  // Update available wards when municipality changes
  useEffect(() => {
    if (municipality && availableMunicipalities.length > 0) {
      const selectedMunicipality = availableMunicipalities.find(m => m.name === municipality);
      if (selectedMunicipality) {
        setAvailableWards(generateWardOptions(municipality, selectedMunicipality.type));
      }
    } else {
      setAvailableWards([]);
      setWard(null);
    }
  }, [municipality, availableMunicipalities]);

  // Notify parent of changes
  useEffect(() => {
    onLocationChange?.({
      province,
      district,
      municipality,
      ward,
    });
  }, [province, district, municipality, ward]);

  const gridClass = compact 
    ? 'grid grid-cols-2 sm:grid-cols-4 gap-2' 
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className={gridClass}>
      {/* Province Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {isNepali ? 'प्रदेश' : 'Province'}
          </Label>
        )}
        <Select value={province} onValueChange={setProvince}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isNepali ? 'प्रदेश छान्नुहोस्' : 'Select Province'} />
          </SelectTrigger>
          <SelectContent>
            {nepalProvinces.map((p) => (
              <SelectItem key={p.name} value={p.name}>
                {isNepali ? p.nepaliName : p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* District Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {isNepali ? 'जिल्ला' : 'District'}
          </Label>
        )}
        <Select value={district} onValueChange={setDistrict} disabled={!province}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isNepali ? 'जिल्ला छान्नुहोस्' : 'Select District'} />
          </SelectTrigger>
          <SelectContent>
            {availableDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Municipality Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {isNepali ? 'नगरपालिका/गाउँपालिका' : 'Municipality'}
          </Label>
        )}
        <Select value={municipality} onValueChange={setMunicipality} disabled={!district}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isNepali ? 'नगरपालिका छान्नुहोस्' : 'Select Municipality'} />
          </SelectTrigger>
          <SelectContent>
            {availableMunicipalities.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {isNepali ? m.nepaliName : m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ward Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {isNepali ? 'वडा' : 'Ward'}
          </Label>
        )}
        <Select 
          value={ward?.toString() || ''} 
          onValueChange={(val) => setWard(parseInt(val))}
          disabled={!municipality}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isNepali ? 'वडा छान्नुहोस्' : 'Select Ward'} />
          </SelectTrigger>
          <SelectContent>
            {availableWards.map((w) => (
              <SelectItem key={w.value} value={w.value.toString()}>
                {isNepali ? w.nepaliLabel : w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
