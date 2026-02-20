import { Field } from '@/hooks/useFields';
import { CropSeason } from '@/hooks/useCropSeasons';
import { Crop } from '@/hooks/useCrops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { MapPin, Leaf, ChevronRight, Trash2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const areaUnits: Record<string, string> = {
  ropani: 'रोपनी',
  katha: 'कठ्ठा',
  bigha: 'बिघा',
  hectare: 'हेक्टर',
};

interface FieldCardProps {
  field: Field;
  seasons: CropSeason[];
  crops: Crop[];
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function getStatusDot(seasons: CropSeason[]): { color: string; label: string } {
  const active = seasons.filter(s => s.is_active);
  if (active.length === 0) return { color: 'bg-muted-foreground/30', label: '' };

  for (const s of active) {
    const days = differenceInDays(new Date(), new Date(s.season_start_date));
    if (days > 20 && days <= 30) return { color: 'bg-accent', label: 'attention' };
  }
  return { color: 'bg-success', label: 'normal' };
}

export function FieldCard({ field, seasons, crops, isSelected, isHighlighted, onSelect, onDelete }: FieldCardProps) {
  const { language } = useLanguage();
  const fieldSeasons = seasons.filter(s => s.field_id === field.id);
  const activeSeason = fieldSeasons.find(s => s.is_active);
  const status = getStatusDot(fieldSeasons);

  const cropInfo = activeSeason
    ? crops.find(c => c.name_ne === activeSeason.crop_name || c.name_en.toLowerCase() === activeSeason.crop_name.toLowerCase())
    : null;

  const daysSincePlanting = activeSeason
    ? differenceInDays(new Date(), new Date(activeSeason.season_start_date))
    : null;

  // Quick today hint
  let todayHint = '';
  if (daysSincePlanting !== null) {
    if (daysSincePlanting >= 0 && daysSincePlanting <= 7) {
      todayHint = language === 'ne' ? 'हल्का सिँचाइ राम्रो' : 'Light irrigation good';
    } else if (daysSincePlanting > 20 && daysSincePlanting <= 30) {
      todayHint = language === 'ne' ? 'युरिया मल हाल्ने समय' : 'Urea fertilizer time';
    }
  }

  return (
    <Card
      data-tour="field-card"
      className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      } ${isHighlighted ? 'animate-pulse ring-2 ring-primary/60 shadow-lg' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status dot */}
          <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${status.color}`} />

          <div className="flex-1 min-w-0">
            {/* Field name + crop */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">{field.name}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Active crop info */}
            {activeSeason && (
              <div className="flex items-center gap-2 mb-1.5">
                {cropInfo?.image_url ? (
                  <img
                    src={cropInfo.image_url}
                    alt={activeSeason.crop_name}
                    className="w-5 h-5 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                ) : (
                  <Leaf className="h-4 w-4 text-primary" />
                )}
                <span className="text-sm text-foreground">
                  {activeSeason.crop_name}
                  {daysSincePlanting !== null && daysSincePlanting >= 0 && (
                    <span className="text-muted-foreground">
                      {' '}– {daysSincePlanting} {language === 'ne' ? 'दिन' : 'days'}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Area + Location line */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {field.area && (
                <span>{field.area} {areaUnits[field.area_unit] || field.area_unit}</span>
              )}
              {field.district && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {field.municipality ? `${field.municipality}, ` : ''}{field.district}
                </span>
              )}
            </div>

            {/* Today hint strip */}
            {todayHint && (
              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-accent/10 text-xs font-medium text-accent-foreground">
                📋 {todayHint}
              </div>
            )}
          </div>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
