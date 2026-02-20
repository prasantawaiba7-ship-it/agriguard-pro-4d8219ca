import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/useLanguage';
import { Mountain } from 'lucide-react';
import { AddFieldStepName } from './wizard/AddFieldStepName';
import { AddFieldStepLocation } from './wizard/AddFieldStepLocation';
import { AddFieldStepCrop } from './wizard/AddFieldStepCrop';

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    area: number | null;
    area_unit: string;
    district: string | null;
    municipality: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => Promise<unknown>;
  onCreateSeason?: (data: {
    field_id: string;
    crop_name: string;
    crop_id?: number;
    variety: string | null;
    season_start_date: string;
    expected_yield: number | null;
    notes: string | null;
  }) => Promise<void>;
}

export interface WizardFieldData {
  name: string;
  area: string;
  areaUnit: string;
  provinceId: number | null;
  districtId: number | null;
  localLevelId: number | null;
  wardNumber: number | null;
  districtName: string | null;
  municipalityString: string | null;
  latitude: number | null;
  longitude: number | null;
  cropId: number | null;
  cropName: string | null;
  startDate: string;
}

const STORAGE_KEY_UNIT = 'kisan_last_area_unit';

export function AddFieldDialog({ open, onOpenChange, onSubmit, onCreateSeason }: AddFieldDialogProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<WizardFieldData>(() => ({
    name: '',
    area: '',
    areaUnit: localStorage.getItem(STORAGE_KEY_UNIT) || 'ropani',
    provinceId: null,
    districtId: null,
    localLevelId: null,
    wardNumber: null,
    districtName: null,
    municipalityString: null,
    latitude: null,
    longitude: null,
    cropId: null,
    cropName: null,
    startDate: new Date().toISOString().split('T')[0],
  }));

  useEffect(() => {
    if (!open) {
      setStep(1);
      setData({
        name: '',
        area: '',
        areaUnit: localStorage.getItem(STORAGE_KEY_UNIT) || 'ropani',
        provinceId: null,
        districtId: null,
        localLevelId: null,
        wardNumber: null,
        districtName: null,
        municipalityString: null,
        latitude: null,
        longitude: null,
        cropId: null,
        cropName: null,
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [open]);

  const updateData = useCallback((partial: Partial<WizardFieldData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = async () => {
    if (!data.name.trim()) return;
    setIsSubmitting(true);
    try {
      localStorage.setItem(STORAGE_KEY_UNIT, data.areaUnit);
      const result = await onSubmit({
        name: data.name.trim(),
        area: data.area ? parseFloat(data.area) : null,
        area_unit: data.areaUnit,
        district: data.districtName || null,
        municipality: data.municipalityString || null,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // If crop was selected and onCreateSeason is provided, create the season too
      if (data.cropName && onCreateSeason && result && typeof result === 'object' && 'id' in result) {
        try {
          await onCreateSeason({
            field_id: (result as { id: string }).id,
            crop_name: data.cropName,
            crop_id: data.cropId ?? undefined,
            variety: null,
            season_start_date: data.startDate,
            expected_yield: null,
            notes: null,
          });
        } catch (err) {
          console.error('Failed to create crop season:', err);
        }
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = language === 'ne'
    ? ['नाम र क्षेत्रफल', 'स्थान', 'बाली']
    : ['Name & Area', 'Location', 'Crop'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Mountain className="h-5 w-5 text-primary" />
              {language === 'ne' ? 'नयाँ खेत थप्नुहोस्' : 'Add New Field'}
            </DialogTitle>
          </DialogHeader>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              {stepLabels.map((label, i) => (
                <span
                  key={i}
                  className={i + 1 === step ? 'text-primary font-semibold' : i + 1 < step ? 'text-primary/60' : ''}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>
            <Progress value={(step / 3) * 100} className="h-1.5" />
          </div>
        </div>

        {/* Steps */}
        <div className="px-5 pb-5">
          {step === 1 && (
            <AddFieldStepName
              data={data}
              updateData={updateData}
              onNext={() => setStep(2)}
              onSkip={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 2 && (
            <AddFieldStepLocation
              data={data}
              updateData={updateData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              onSkip={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
          {step === 3 && (
            <AddFieldStepCrop
              data={data}
              updateData={updateData}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
