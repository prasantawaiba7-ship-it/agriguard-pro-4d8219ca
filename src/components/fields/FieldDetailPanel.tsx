import { useState } from 'react';
import { Field } from '@/hooks/useFields';
import { CropSeason } from '@/hooks/useCropSeasons';
import { Crop } from '@/hooks/useCrops';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoilAdvisoryCard } from '@/components/soil/SoilAdvisoryCard';
import { CropGuideCard } from '@/components/fields/CropGuideCard';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Mountain, Sprout, TestTube, MapPin, Leaf, Calendar, Eye, BookOpen,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const areaUnits: Record<string, string> = {
  ropani: 'रोपनी',
  katha: 'कठ्ठा',
  bigha: 'बिघा',
  hectare: 'हेक्टर',
};

interface FieldDetailPanelProps {
  field: Field;
  seasons: CropSeason[];
  crops: Crop[];
  onAddCrop: () => void;
  onSoilTest: () => void;
  onEndSeason: (seasonId: string) => void;
}

export function FieldDetailPanel({
  field, seasons, crops, onAddCrop, onSoilTest, onEndSeason,
}: FieldDetailPanelProps) {
  const { t, language } = useLanguage();
  const [viewingGuide, setViewingGuide] = useState<CropSeason | null>(null);

  const fieldSeasons = seasons.filter(s => s.field_id === field.id);

  const getCropForSeason = (season: CropSeason) =>
    crops.find(c => c.name_ne === season.crop_name || c.name_en.toLowerCase() === season.crop_name.toLowerCase());

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/15">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mountain className="h-5 w-5 text-primary" />
              {field.name}
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onSoilTest} className="gap-1.5 h-9">
                <TestTube className="h-4 w-4" />
                <span className="hidden sm:inline">{t('soilTest')}</span>
              </Button>
              <Button size="sm" onClick={onAddCrop} className="gap-1.5 h-9">
                <Sprout className="h-4 w-4" />
                {t('addCrop')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {field.area && (
              <span><strong>{t('area')}:</strong> {field.area} {areaUnits[field.area_unit] || field.area_unit}</span>
            )}
            {field.district && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {field.municipality ? `${field.municipality}, ` : ''}{field.district}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-11">
          <TabsTrigger value="overview" className="text-xs sm:text-sm gap-1">
            📋 {language === 'ne' ? 'सारांश' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="inputs" className="text-xs sm:text-sm gap-1">
            🧪 {language === 'ne' ? 'मल/बिउ' : 'Inputs'}
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-xs sm:text-sm gap-1">
            📘 {language === 'ne' ? 'गाइड' : 'Guide'}
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4">
          {fieldSeasons.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Sprout className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">{t('noCropsInField')}</p>
                <Button variant="outline" className="mt-4" onClick={onAddCrop}>
                  {t('addCropBtn')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {fieldSeasons.map(season => {
                const cropInfo = getCropForSeason(season);
                const days = differenceInDays(new Date(), new Date(season.season_start_date));

                return (
                  <Card key={season.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {cropInfo?.image_url ? (
                          <img
                            src={cropInfo.image_url}
                            alt={season.crop_name}
                            className="w-11 h-11 rounded-xl object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                            <Leaf className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{season.crop_name}</h4>
                            {season.variety && (
                              <span className="text-xs text-muted-foreground">({season.variety})</span>
                            )}
                            <Badge variant={season.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {season.is_active ? t('active') : t('completed')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(season.season_start_date), 'yyyy-MM-dd')}
                            </span>
                            {days >= 0 && (
                              <span>{days} {language === 'ne' ? 'दिन भयो' : 'days ago'}</span>
                            )}
                          </div>
                          {season.expected_yield && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {t('expected')}: {season.expected_yield} {t('quintal')}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-xs"
                            onClick={() => setViewingGuide(season)}
                          >
                            <Eye className="h-3 w-3" />
                            {t('guide')}
                          </Button>
                          {season.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => onEndSeason(season.id)}
                            >
                              {t('end')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Inline Guide Card */}
          {viewingGuide && (() => {
            const cropInfo = getCropForSeason(viewingGuide);
            return cropInfo ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {language === 'ne' ? 'बाली गाइड' : 'Crop Guide'}
                  </h4>
                  <Button size="sm" variant="ghost" onClick={() => setViewingGuide(null)} className="text-xs h-7">
                    ✕ {language === 'ne' ? 'बन्द' : 'Close'}
                  </Button>
                </div>
                <CropGuideCard
                  cropId={cropInfo.id}
                  cropName={cropInfo.name_ne}
                  cropNameEn={cropInfo.name_en}
                  cropImage={cropInfo.image_url}
                  autoLoad
                />
              </div>
            ) : null;
          })()}
        </TabsContent>

        {/* INPUTS TAB */}
        <TabsContent value="inputs" className="mt-4">
          <SoilAdvisoryCard fields={[field]} />
        </TabsContent>

        {/* GUIDE TAB */}
        <TabsContent value="guide" className="mt-4 space-y-3">
          {fieldSeasons.filter(s => s.is_active).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ne' ? 'पहिले बाली थप्नुहोस्, त्यसपछि गाइड देखिनेछ।' : 'Add a crop first to see its guide.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            fieldSeasons.filter(s => s.is_active).map(season => {
              const cropInfo = getCropForSeason(season);
              if (!cropInfo) return null;
              return (
                <CropGuideCard
                  key={season.id}
                  cropId={cropInfo.id}
                  cropName={cropInfo.name_ne}
                  cropNameEn={cropInfo.name_en}
                  cropImage={cropInfo.image_url}
                  autoLoad={false}
                />
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
