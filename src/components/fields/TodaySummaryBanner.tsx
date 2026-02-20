import { CropSeason } from '@/hooks/useCropSeasons';
import { useLanguage } from '@/hooks/useLanguage';
import { CalendarCheck, Droplets, Sparkles } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface TodaySummaryBannerProps {
  seasons: CropSeason[];
  fieldCount: number;
}

export function TodaySummaryBanner({ seasons, fieldCount }: TodaySummaryBannerProps) {
  const { language } = useLanguage();

  const activeSeasons = seasons.filter(s => s.is_active);

  // Simple heuristic hints
  const hints: { icon: React.ReactNode; text: string }[] = [];

  activeSeasons.forEach(s => {
    const daysSincePlanting = differenceInDays(new Date(), new Date(s.season_start_date));
    if (daysSincePlanting >= 0 && daysSincePlanting <= 7) {
      hints.push({
        icon: <Droplets className="h-4 w-4 text-primary" />,
        text: language === 'ne'
          ? `${s.crop_name}: हल्का सिँचाइ गर्नुहोस्`
          : `${s.crop_name}: Light irrigation needed`,
      });
    }
    if (daysSincePlanting > 20 && daysSincePlanting <= 30) {
      hints.push({
        icon: <Sparkles className="h-4 w-4 text-secondary" />,
        text: language === 'ne'
          ? `${s.crop_name}: युरिया मल हाल्ने समय`
          : `${s.crop_name}: Time for urea fertilizer`,
      });
    }
  });

  if (hints.length === 0 && activeSeasons.length > 0) {
    hints.push({
      icon: <CalendarCheck className="h-4 w-4 text-primary" />,
      text: language === 'ne'
        ? `${activeSeasons.length} बाली सक्रिय छन् — सबै ठिक छ`
        : `${activeSeasons.length} active crops — all on track`,
    });
  }

  if (fieldCount === 0) return null;

  return (
    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-2">
        <CalendarCheck className="h-4 w-4" />
        {language === 'ne' ? 'आजको सारांश' : "Today's Summary"}
      </h3>
      <div className="space-y-1.5">
        {hints.map((hint, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-foreground">
            {hint.icon}
            <span>{hint.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
