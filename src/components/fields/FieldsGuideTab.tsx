import { CropSeason } from '@/hooks/useCropSeasons';
import { Crop } from '@/hooks/useCrops';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Leaf } from 'lucide-react';

interface FieldsGuideTabProps {
  seasons: CropSeason[];
  crops: Crop[];
}

export function FieldsGuideTab({ seasons, crops }: FieldsGuideTabProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Get unique active crop names with their crop info
  const activeCropNames = [...new Set(seasons.filter(s => s.is_active).map(s => s.crop_name))];
  const cropGuideItems = activeCropNames.map(name => {
    const crop = crops.find(c => c.name_ne === name || c.name_en.toLowerCase() === name.toLowerCase());
    return { name, crop };
  });

  return (
    <div className="space-y-5">
      {/* For My Fields */}
      {cropGuideItems.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            🌾 {language === 'ne' ? 'मेरा बालीका गाइडहरू' : 'Guides for My Crops'}
          </h3>
          <div className="space-y-2">
            {cropGuideItems.map(({ name, crop }) => (
              <Card
                key={name}
                className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => navigate('/guides', { state: { cropName: name } })}
              >
                <CardContent className="p-3.5 flex items-center gap-3">
                  {crop?.image_url ? (
                    <img
                      src={crop.image_url}
                      alt={name}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    {crop?.name_en && (
                      <p className="text-xs text-muted-foreground">{crop.name_en}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs h-8">
                    {language === 'ne' ? 'गाइड' : 'Guide'}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Guides */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          📚 {language === 'ne' ? 'सबै गाइडहरू' : 'All Guides'}
        </h3>
        <Card
          className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
          onClick={() => navigate('/guides')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {language === 'ne' ? 'सम्पूर्ण बाली पुस्तकालय' : 'Full Crop Library'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'ne' ? 'सबै बालीका खेती गाइड हेर्नुहोस्' : 'Browse all crop guides'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
