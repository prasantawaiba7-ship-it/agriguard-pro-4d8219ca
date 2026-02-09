import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useFields, Field } from '@/hooks/useFields';
import { useCropSeasons, CropSeason } from '@/hooks/useCropSeasons';
import { SoilTestForm } from '@/components/soil/SoilTestForm';
import { SoilAdvisoryCard } from '@/components/soil/SoilAdvisoryCard';
import { AddCropSeasonModal } from '@/components/fields/AddCropSeasonModal';
import { CropGuideCard } from '@/components/fields/CropGuideCard';
import { AddFieldDialog } from '@/components/fields/AddFieldDialog';
import { useCrops } from '@/hooks/useCrops';
import { 
  MapPin, Plus, Trash2, Leaf, Calendar, ChevronRight,
  Sprout, TestTube, Loader2, Mountain, BookOpen, Eye
} from 'lucide-react';
import { format } from 'date-fns';

const areaUnits = [
  { value: 'ropani', label: 'रोपनी' },
  { value: 'katha', label: 'कठ्ठा' },
  { value: 'bigha', label: 'बिघा' },
  { value: 'hectare', label: 'हेक्टर' },
];

const FieldsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { fields, isLoading: fieldsLoading, addField, updateField, deleteField } = useFields();
  const { seasons, createSeason, updateSeason } = useCropSeasons();
  const { activeCrops } = useCrops();
  
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isSoilTestOpen, setIsSoilTestOpen] = useState(false);
  const [viewingGuideForSeason, setViewingGuideForSeason] = useState<CropSeason | null>(null);
  

  if (authLoading || fieldsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleDeleteField = async (id: string) => {
    if (confirm(t('confirmDeleteField'))) {
      await deleteField(id);
      if (selectedField?.id === id) setSelectedField(null);
    }
  };

  const handleCreateSeason = async (data: {
    crop_name: string;
    crop_id?: number;
    variety: string | null;
    season_start_date: string;
    expected_yield: number | null;
    notes: string | null;
  }) => {
    if (!selectedField) return;

    await createSeason({
      field_id: selectedField.id,
      crop_name: data.crop_name,
      variety: data.variety,
      season_start_date: data.season_start_date,
      season_end_date: null,
      expected_yield: data.expected_yield,
      actual_yield: null,
      notes: data.notes,
      is_active: true,
    });
  };

  // Get crop info for a season
  const getCropForSeason = (season: CropSeason) => {
    return activeCrops.find(c => 
      c.name_ne === season.crop_name || c.name_en.toLowerCase() === season.crop_name.toLowerCase()
    );
  };

  const fieldSeasons = seasons.filter(s => s.field_id === selectedField?.id);

  return (
    <>
      <Helmet>
        <title>{t('fieldsPageTitle')} - Kisan Sathi</title>
        <meta name="description" content={t('fieldsPageSubtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-28">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Mountain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  {t('fieldsPageTitle')}
                </h1>
                <p className="text-sm text-muted-foreground">{t('fieldsPageSubtitle')}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 sm:gap-2"
                  onClick={() => navigate('/guides', { state: { from: '/fields' } })}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('farmingGuideBtn')}</span>
                  <span className="sm:hidden">{t('guideShort')}</span>
                </Button>
                <Button className="gap-1 sm:gap-2" size="sm" onClick={() => setIsAddFieldOpen(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('newField')}</span>
                  <span className="sm:hidden">{t('addShort')}</span>
                </Button>
                <AddFieldDialog
                  open={isAddFieldOpen}
                  onOpenChange={setIsAddFieldOpen}
                  onSubmit={addField}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Fields List */}
              <div className="space-y-4">
                <h2 className="font-semibold text-base sm:text-lg">{t('fieldsCount')} ({fields.length})</h2>
                
                {fields.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Mountain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('noFieldsYet')}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsAddFieldOpen(true)}
                      >
                        {t('addFirstField')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  fields.map((field) => (
                    <Card 
                      key={field.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedField?.id === field.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedField(field)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {field.name}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </h3>
                            {field.area && (
                              <p className="text-sm text-muted-foreground">
                                {field.area} {areaUnits.find(u => u.value === field.area_unit)?.label}
                              </p>
                            )}
                            {field.district && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {field.municipality && `${field.municipality}, `}{field.district}
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Field Detail */}
              <div className="md:col-span-2 space-y-6">
                {!selectedField ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Leaf className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">{t('selectField')}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t('selectFieldHint')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Selected Field Header */}
                    <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Mountain className="h-5 w-5 text-primary" />
                            {selectedField.name}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setIsSoilTestOpen(true)}
                            >
                              <TestTube className="h-4 w-4 mr-1" />
                              {t('soilTest')}
                            </Button>
                            <Button size="sm" onClick={() => setIsAddSeasonOpen(true)}>
                              <Sprout className="h-4 w-4 mr-1" />
                              {t('addCrop')}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {selectedField.area && (
                            <span>
                              <strong>{t('area')}:</strong> {selectedField.area} {areaUnits.find(u => u.value === selectedField.area_unit)?.label}
                            </span>
                          )}
                          {selectedField.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {selectedField.municipality && `${selectedField.municipality}, `}{selectedField.district}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Soil Advisory */}
                    <SoilAdvisoryCard fields={selectedField ? [selectedField] : []} />

                    {/* Crop Seasons */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Leaf className="h-5 w-5 text-success" />
                          {t('cropSeasons')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {fieldSeasons.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Sprout className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>{t('noCropsInField')}</p>
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => setIsAddSeasonOpen(true)}
                            >
                              {t('addCropBtn')}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fieldSeasons.map((season) => {
                              const cropInfo = getCropForSeason(season);
                              return (
                                <div 
                                  key={season.id}
                                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 rounded-lg bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                                {cropInfo?.image_url ? (
                                                      <img 
                                                        src={cropInfo.image_url} 
                                                        alt={season.crop_name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                        onError={(e) => {
                                                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                                                        }}
                                                      />
                                                    ) : (
                                                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                                        <Leaf className="h-5 w-5 text-primary" />
                                                      </div>
                                                    )}
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold">{season.crop_name}</h4>
                                        {season.variety && (
                                          <span className="text-sm text-muted-foreground">({season.variety})</span>
                                        )}
                                        <Badge variant={season.is_active ? 'default' : 'secondary'}>
                                          {season.is_active ? t('active') : t('completed')}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(season.season_start_date), 'yyyy-MM-dd')}
                                        </span>
                                        {season.expected_yield && (
                                          <span>{t('expected')}: {season.expected_yield} {t('quintal')}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-auto">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setViewingGuideForSeason(season)}
                                      className="gap-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                       {t('guide')}
                                    </Button>
                                    {season.is_active && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateSeason(season.id, { 
                                          is_active: false, 
                                          season_end_date: format(new Date(), 'yyyy-MM-dd')
                                        })}
                                      >
                                        {t('end')}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* Soil Test Dialog */}
            <Dialog open={isSoilTestOpen} onOpenChange={setIsSoilTestOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('addSoilTest')}</DialogTitle>
                </DialogHeader>
                {selectedField && (
                  <SoilTestForm 
                    fields={[selectedField]} 
                    onSuccess={() => setIsSoilTestOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Add Crop Season Modal */}
            <AddCropSeasonModal
              isOpen={isAddSeasonOpen}
              onClose={() => setIsAddSeasonOpen(false)}
              onSubmit={handleCreateSeason}
              fieldName={selectedField?.name}
            />

            {/* Guide Dialog for Season */}
            <Dialog open={!!viewingGuideForSeason} onOpenChange={() => setViewingGuideForSeason(null)}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                {viewingGuideForSeason && (() => {
                  const cropInfo = getCropForSeason(viewingGuideForSeason);
                  return cropInfo ? (
                    <CropGuideCard
                      cropId={cropInfo.id}
                      cropName={cropInfo.name_ne}
                      cropNameEn={cropInfo.name_en}
                      cropImage={cropInfo.image_url}
                      autoLoad={true}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                       <p className="text-muted-foreground">
                         {t('guideNotAvailable')}
                       </p>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FieldsPage;
