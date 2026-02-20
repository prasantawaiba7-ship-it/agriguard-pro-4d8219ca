import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import { ArrowRight } from 'lucide-react';
import type { WizardFieldData } from '../AddFieldDialog';

interface Props {
  data: WizardFieldData;
  updateData: (partial: Partial<WizardFieldData>) => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export function AddFieldStepName({ data, updateData, onNext, onSkip, isSubmitting }: Props) {
  const { t, language } = useLanguage();

  const suggestions = [
    t('fieldFront'), t('fieldBack'), t('fieldUpper'), t('fieldLower'),
    t('fieldRiver'), t('fieldRoad'), t('fieldRice'), t('fieldVegetable'),
  ];

  const areaUnits = [
    { value: 'ropani', label: t('ropani') },
    { value: 'katha', label: t('katha') },
    { value: 'bigha', label: t('bigha') },
    { value: 'hectare', label: t('hectare') },
  ];

  const canProceed = data.name.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Field name */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('fieldName')}</Label>
        <Input
          placeholder={t('fieldNamePlaceholder')}
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          className="h-12 text-base"
          autoFocus
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {suggestions.map((s) => (
            <Badge
              key={s}
              variant={data.name === s ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors text-sm py-1 px-3 touch-manipulation"
              onClick={() => updateData({ name: s })}
            >
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Area + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">{t('areaLabel')}</Label>
          <Input
            type="number"
            placeholder="5"
            value={data.area}
            onChange={(e) => updateData({ area: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('unitLabel')}</Label>
          <Select value={data.areaUnit} onValueChange={(v) => updateData({ areaUnit: v })}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {areaUnits.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {language === 'ne'
          ? 'अन्दाज भए पुग्छ, पछि बदल्न सक्नुहुन्छ।'
          : 'An estimate is fine, you can change it later.'}
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 h-12 text-base gap-2"
        >
          {language === 'ne' ? 'अर्को (स्थान)' : 'Next (Location)'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        disabled={!canProceed || isSubmitting}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1 disabled:opacity-40"
      >
        {language === 'ne' ? 'स्थान/बाली पछि गर्ने — अहिले सेभ गर्ने' : 'Skip — save now'}
      </button>
    </div>
  );
}
