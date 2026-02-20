import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrops, Crop } from '@/hooks/useCrops';
import { useLanguage } from '@/hooks/useLanguage';
import { ArrowLeft, Loader2, Sprout, Search, Check } from 'lucide-react';
import type { WizardFieldData } from '../AddFieldDialog';

interface Props {
  data: WizardFieldData;
  updateData: (partial: Partial<WizardFieldData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const POPULAR_CROPS_NE = ['धान', 'मकै', 'गहुँ', 'आलु', 'टमाटर', 'खुर्सानी', 'बन्दा', 'काउली'];

export function AddFieldStepCrop({ data, updateData, onBack, onSubmit, isSubmitting }: Props) {
  const { language } = useLanguage();
  const { activeCrops, isLoading } = useCrops();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');

  const popularCrops = useMemo(() =>
    activeCrops.filter(c => POPULAR_CROPS_NE.includes(c.name_ne)),
    [activeCrops]
  );

  const filteredCrops = useMemo(() => {
    if (!search.trim()) return activeCrops;
    const q = search.toLowerCase();
    return activeCrops.filter(c =>
      c.name_ne.toLowerCase().includes(q) || c.name_en.toLowerCase().includes(q)
    );
  }, [activeCrops, search]);

  const selectCrop = (crop: Crop) => {
    updateData({ cropId: crop.id, cropName: crop.name_ne });
  };

  const clearCrop = () => {
    updateData({ cropId: null, cropName: null });
  };

  const CropChip = ({ crop }: { crop: Crop }) => {
    const isSelected = data.cropId === crop.id;
    return (
      <Badge
        variant={isSelected ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/10 transition-colors text-sm py-2 px-3.5 gap-1.5 touch-manipulation"
        onClick={() => isSelected ? clearCrop() : selectCrop(crop)}
      >
        {crop.image_url ? (
          <img src={crop.image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
        ) : (
          <Sprout className="h-3.5 w-3.5" />
        )}
        {crop.name_ne}
        {isSelected && <Check className="h-3.5 w-3.5 ml-0.5" />}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Sprout className="h-4 w-4 text-primary" />
        {language === 'ne' ? 'बाली छान्नुहोस् (ऐच्छिक)' : 'Select Crop (optional)'}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Popular crops */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {language === 'ne' ? 'लोकप्रिय बाली' : 'Popular Crops'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {popularCrops.map(c => <CropChip key={c.id} crop={c} />)}
            </div>
          </div>

          {/* Show all toggle */}
          {!showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-sm text-primary hover:underline"
            >
              {language === 'ne' ? 'सबै बाली हेर्नुहोस्' : 'Browse all crops'} →
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ne' ? 'बाली खोज्नुहोस्...' : 'Search crops...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <ScrollArea className="h-40">
                <div className="flex flex-wrap gap-2 pr-2">
                  {filteredCrops.map(c => <CropChip key={c.id} crop={c} />)}
                  {filteredCrops.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4">
                      {language === 'ne' ? 'कुनै बाली फेला परेन' : 'No crops found'}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Selected crop summary */}
          {data.cropName && (
            <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">✅ {data.cropName}</span>
              <button onClick={clearCrop} className="text-xs text-muted-foreground hover:text-destructive">
                {language === 'ne' ? 'हटाउने' : 'Remove'}
              </button>
            </div>
          )}

          {/* Start date */}
          {data.cropName && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {language === 'ne' ? 'सुरु मिति (रोपेको/बिउ छर्केको)' : 'Start date'}
              </Label>
              <Input
                type="date"
                value={data.startDate}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ne'
                  ? 'यस मितिका आधारमा मल र कामको तालिका बनाइन्छ।'
                  : 'Fertilizer & task schedule will be based on this date.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-11 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {language === 'ne' ? 'अघिल्लो' : 'Back'}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 h-12 text-base gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sprout className="h-4 w-4" />
          )}
          {language === 'ne' ? 'खेत तयार गर्नुहोस्' : 'Create Field'}
        </Button>
      </div>
    </div>
  );
}
