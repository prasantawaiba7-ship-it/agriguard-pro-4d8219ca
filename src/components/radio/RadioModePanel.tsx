import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, Square, Loader2, Volume2 } from 'lucide-react';
import { useRadioMode } from '@/hooks/useRadioMode';
import { useCrops } from '@/hooks/useCrops';
import { useLanguage } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { value: 'रोपाइँ', label: 'रोपाइँ (Transplanting)' },
  { value: 'वाढ्ने चरण', label: 'वाढ्ने चरण (Vegetative)' },
  { value: 'फूल लाग्ने', label: 'फूल लाग्ने (Flowering)' },
  { value: 'फल लाग्ने', label: 'फल लाग्ने (Fruiting)' },
  { value: 'भित्र्याउने', label: 'भित्र्याउने (Harvesting)' },
];

export function RadioModePanel() {
  const { language } = useLanguage();
  const { activeCrops, isLoading: cropsLoading } = useCrops();
  const { isPlaying, currentTip, tipCount, isFetching, isSpeaking, start, stop } = useRadioMode({
    intervalSeconds: 45,
    language,
  });

  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [location, setLocation] = useState('');

  const handleToggle = () => {
    if (isPlaying) {
      stop();
    } else {
      if (!selectedCrop || !selectedStage) return;
      const cropObj = activeCrops.find(c => c.id.toString() === selectedCrop);
      start({
        crop: cropObj ? `${cropObj.name_ne} (${cropObj.name_en})` : selectedCrop,
        stage: selectedStage,
        location: location || undefined,
      });
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Radio className="w-5 h-5 text-primary" />
          📻 कृषि रेडियो मोड (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info text */}
        {!isPlaying && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            फोनको स्पीकर voice मा AI tips सुन्न सकिन्छ। कृपया खेतमा काम गर्दा वातावरण ध्यान दिनुहोस्; खतरनाक रसायन प्रयोग गर्नु अघि सधैं स्थानीय कृषि कार्यालयसँग सल्लाह लिनुहोस्।
          </p>
        )}

        {/* Selectors - hidden while playing */}
        {!isPlaying && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">बाली छान्नुहोस्</Label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="बाली छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent>
                  {cropsLoading ? (
                    <SelectItem value="_loading" disabled>लोड हुँदैछ...</SelectItem>
                  ) : (
                    activeCrops.map(crop => (
                      <SelectItem key={crop.id} value={crop.id.toString()}>
                        {crop.name_ne} ({crop.name_en})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">चरण छान्नुहोस्</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="चरण छान्नुहोस्" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">स्थान (ऐच्छिक)</Label>
              <Input
                placeholder="जिल्ला, जस्तै: चितवन"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* Current tip display */}
        <AnimatePresence mode="wait">
          {isPlaying && currentTip && (
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-background/80 border border-primary/10"
            >
              <div className="flex items-start gap-2">
                {isSpeaking && (
                  <Volume2 className="w-4 h-4 text-primary mt-0.5 animate-pulse flex-shrink-0" />
                )}
                <p className="text-sm leading-relaxed">{currentTip}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                टिप #{tipCount} {isFetching && '• अर्को लोड हुँदैछ...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <Button
          onClick={handleToggle}
          disabled={!isPlaying && (!selectedCrop || !selectedStage)}
          className={`w-full h-12 text-base font-semibold ${
            isPlaying
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
          size="lg"
        >
          {isPlaying ? (
            <>
              <Square className="w-5 h-5 mr-2" />
              ⏹ रेडियो मोड बन्द गर्नुहोस्
            </>
          ) : isFetching ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              सुरु हुँदैछ...
            </>
          ) : (
            <>
              <Radio className="w-5 h-5 mr-2" />
              ▶ रेडियो मोड सुरु गर्नुहोस्
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
