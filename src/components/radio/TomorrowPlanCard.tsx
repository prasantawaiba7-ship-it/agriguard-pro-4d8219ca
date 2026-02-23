import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { useTomorrowPlan } from '@/hooks/useTomorrowPlan';

interface TomorrowPlanCardProps {
  crop: string;
  stage: string;
  location?: string;
}

export function TomorrowPlanCard({ crop, stage, location }: TomorrowPlanCardProps) {
  const { planText, isGenerating, showCard, isSpeaking, generate, speakPlan } = useTomorrowPlan({
    crop, stage, location,
  });

  if (!showCard) return null;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Moon className="w-4 h-4 text-accent" />
          🌙 भोलिको योजना (Tomorrow's Plan)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {planText ? (
          <>
            <p className="text-sm leading-relaxed text-foreground">{planText}</p>
            <Button
              onClick={speakPlan}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isSpeaking ? (
                <><VolumeX className="w-4 h-4 mr-2" /> बन्द गर्नुहोस्</>
              ) : (
                <><Volume2 className="w-4 h-4 mr-2" /> ▶ आवाजमा सुन्नुहोस्</>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              भोलि बिहान/दिनभर के काम गर्ने, AI ले योजना बनाइदिन्छ।
            </p>
            <Button
              onClick={generate}
              disabled={isGenerating || !crop || !stage}
              className="w-full"
              size="sm"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> बनाउँदैछ...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> योजना बनाउनुहोस्</>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
