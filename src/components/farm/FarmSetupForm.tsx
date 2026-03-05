import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Droplets, Plus } from 'lucide-react';
import { useCreateFarm, useUpdateFarm, Farm } from '@/hooks/useFarms';

const AREA_UNITS = ['ropani', 'bigha', 'kattha', 'hectare', 'acre'];
const IRRIGATION_TYPES = ['canal', 'boring', 'rain-fed', 'drip', 'sprinkler'];
const COMMON_CROPS = ['धान', 'गहुँ', 'मकै', 'आलु', 'गोलभेडा', 'काउली', 'बन्दा', 'मूला', 'भट्टमास', 'दाल'];

interface FarmSetupFormProps {
  editFarm?: Farm;
  onSuccess?: () => void;
}

export function FarmSetupForm({ editFarm, onSuccess }: FarmSetupFormProps) {
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const isEdit = !!editFarm;

  const [farmName, setFarmName] = useState(editFarm?.farm_name || '');
  const [village, setVillage] = useState(editFarm?.village || '');
  const [district, setDistrict] = useState(editFarm?.district || '');
  const [totalArea, setTotalArea] = useState(editFarm?.total_area?.toString() || '');
  const [areaUnit, setAreaUnit] = useState(editFarm?.area_unit || 'ropani');
  const [irrigationType, setIrrigationType] = useState(editFarm?.irrigation_type || '');
  const [mainCrops, setMainCrops] = useState<string[]>(editFarm?.main_crops || []);
  const [cropInput, setCropInput] = useState('');

  const isSubmitting = createFarm.isPending || updateFarm.isPending;

  const addCrop = (crop: string) => {
    const trimmed = crop.trim();
    if (trimmed && !mainCrops.includes(trimmed)) {
      setMainCrops(prev => [...prev, trimmed]);
    }
    setCropInput('');
  };

  const removeCrop = (crop: string) => setMainCrops(prev => prev.filter(c => c !== crop));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;

    const payload = {
      farm_name: farmName.trim(),
      village: village || undefined,
      district: district || undefined,
      total_area: totalArea ? parseFloat(totalArea) : undefined,
      area_unit: areaUnit,
      main_crops: mainCrops,
      irrigation_type: irrigationType || undefined,
    };

    if (isEdit) {
      await updateFarm.mutateAsync({ id: editFarm.id, ...payload });
    } else {
      await createFarm.mutateAsync(payload);
    }
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{isEdit ? '✏️ खेत सम्पादन' : '🌾 नयाँ खेत थप्नुहोस्'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>खेतको नाम *</Label>
            <Input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="जस्तै: घर अगाडिको खेत" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label><MapPin className="w-3 h-3 inline mr-1" />गाउँ/टोल</Label>
              <Input value={village} onChange={e => setVillage(e.target.value)} placeholder="गाउँ" />
            </div>
            <div>
              <Label>जिल्ला</Label>
              <Input value={district} onChange={e => setDistrict(e.target.value)} placeholder="जिल्ला" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>क्षेत्रफल</Label>
              <Input type="number" step="0.01" value={totalArea} onChange={e => setTotalArea(e.target.value)} placeholder="जस्तै: 5" />
            </div>
            <div>
              <Label>एकाइ</Label>
              <Select value={areaUnit} onValueChange={setAreaUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREA_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label><Droplets className="w-3 h-3 inline mr-1" />सिँचाइ प्रकार</Label>
            <Select value={irrigationType} onValueChange={setIrrigationType}>
              <SelectTrigger><SelectValue placeholder="छान्नुहोस्" /></SelectTrigger>
              <SelectContent>
                {IRRIGATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>मुख्य बालीहरू</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {mainCrops.map(c => (
                <span key={c} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => removeCrop(c)}>
                  {c} ✕
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={cropInput} onChange={e => setCropInput(e.target.value)} placeholder="बाली थप्नुहोस्"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrop(cropInput); } }} />
              <Button type="button" variant="outline" size="icon" onClick={() => addCrop(cropInput)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_CROPS.filter(c => !mainCrops.includes(c)).slice(0, 6).map(c => (
                <button key={c} type="button" className="text-xs bg-muted px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors" onClick={() => addCrop(c)}>{c}</button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !farmName.trim()}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'अपडेट गर्नुहोस्' : 'खेत थप्नुहोस्'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
