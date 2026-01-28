import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCrops } from '@/hooks/useCrops';
import { usePriceAlerts, CreatePriceAlertInput, PriceAlertCondition } from '@/hooks/usePriceAlerts';
import { Bell, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PriceAlertFormProps {
  onClose: () => void;
  preselectedCropId?: number;
  preselectedMarketCode?: string;
}

export function PriceAlertForm({ onClose, preselectedCropId, preselectedMarketCode }: PriceAlertFormProps) {
  const { activeCrops, isLoading: cropsLoading } = useCrops();
  const { createAlert } = usePriceAlerts();
  
  const [cropId, setCropId] = useState<number | null>(preselectedCropId || null);
  const [marketCode, setMarketCode] = useState<string>(preselectedMarketCode || '');
  const [conditionType, setConditionType] = useState<PriceAlertCondition>('greater_equal');
  const [thresholdValue, setThresholdValue] = useState<string>('');
  const [percentReferenceDays, setPercentReferenceDays] = useState<string>('7');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch markets with market_code
  const { data: markets = [] } = useQuery({
    queryKey: ['markets-with-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('markets')
        .select('id, market_code, name_ne, name_en')
        .eq('is_active', true)
        .not('market_code', 'is', null)
        .order('name_ne');
      if (error) throw error;
      return data || [];
    },
  });

  const isPercentCondition = conditionType === 'percent_increase' || conditionType === 'percent_decrease';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cropId || !thresholdValue) {
      return;
    }

    setIsSubmitting(true);
    
    const input: CreatePriceAlertInput = {
      crop_id: cropId,
      market_code: marketCode || null,
      condition_type: conditionType,
      threshold_value: parseFloat(thresholdValue),
      percent_reference_days: isPercentCondition ? parseInt(percentReferenceDays) : undefined,
      is_recurring: isRecurring,
    };

    const success = await createAlert(input);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const conditionOptions: { value: PriceAlertCondition; label: string }[] = [
    { value: 'greater_equal', label: 'मूल्य ≥ (बढ्यो/पुग्यो)' },
    { value: 'less_equal', label: 'मूल्य ≤ (घट्यो)' },
    { value: 'percent_increase', label: '% बढ्यो' },
    { value: 'percent_decrease', label: '% घट्यो' },
  ];

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            नयाँ मूल्य अलर्ट
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crop Selection */}
          <div className="space-y-2">
            <Label htmlFor="crop">बाली छान्नुहोस् *</Label>
            <Select 
              value={cropId?.toString() || ''} 
              onValueChange={(v) => setCropId(parseInt(v))}
            >
              <SelectTrigger id="crop">
                <SelectValue placeholder="बाली छान्नुहोस्..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cropsLoading ? (
                  <div className="p-2 text-center text-muted-foreground">लोड हुँदैछ...</div>
                ) : (
                  activeCrops.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id.toString()}>
                      {crop.name_ne} ({crop.name_en})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Market Selection (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="market">बजार (ऐच्छिक)</Label>
            <Select value={marketCode || '_all'} onValueChange={(v) => setMarketCode(v === '_all' ? '' : v)}>
              <SelectTrigger id="market">
                <SelectValue placeholder="सबै बजार" />
              </SelectTrigger>
          <SelectContent className="max-h-60">
                <SelectItem value="_all">सबै बजार</SelectItem>
                {markets.map((market: any) => (
                  <SelectItem key={market.market_code} value={market.market_code}>
                    {market.name_ne}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition Type */}
          <div className="space-y-2">
            <Label htmlFor="condition">सर्त</Label>
            <Select 
              value={conditionType} 
              onValueChange={(v) => setConditionType(v as PriceAlertCondition)}
            >
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Threshold Value */}
          <div className="space-y-2">
            <Label htmlFor="threshold">
              {isPercentCondition ? 'प्रतिशत (%)' : 'मूल्य (रु.)'}
            </Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              placeholder={isPercentCondition ? 'उदा: 10' : 'उदा: 60'}
              required
            />
          </div>

          {/* Reference Days (for percent conditions) */}
          {isPercentCondition && (
            <div className="space-y-2">
              <Label htmlFor="days">कति दिनको तुलना?</Label>
              <Select value={percentReferenceDays} onValueChange={setPercentReferenceDays}>
                <SelectTrigger id="days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">हिजो</SelectItem>
                  <SelectItem value="3">३ दिन</SelectItem>
                  <SelectItem value="7">१ हप्ता</SelectItem>
                  <SelectItem value="14">२ हप्ता</SelectItem>
                  <SelectItem value="30">१ महिना</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="recurring" className="cursor-pointer">
              बारम्बार अलर्ट (दोहोर्याउने)
            </Label>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!cropId || !thresholdValue || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                सेट गर्दै...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                अलर्ट सेट गर्नुहोस्
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
