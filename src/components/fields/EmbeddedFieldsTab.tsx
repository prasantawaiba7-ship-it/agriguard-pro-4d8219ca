import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useFields } from '@/hooks/useFields';
import { useCropSeasons } from '@/hooks/useCropSeasons';
import { useCrops } from '@/hooks/useCrops';
import { SoilTestForm } from '@/components/soil/SoilTestForm';
import { AddCropSeasonModal } from '@/components/fields/AddCropSeasonModal';
import { AddFieldDialog } from '@/components/fields/AddFieldDialog';
import { TodaySummaryBanner } from '@/components/fields/TodaySummaryBanner';
import { FieldCard } from '@/components/fields/FieldCard';
import { FieldDetailPanel } from '@/components/fields/FieldDetailPanel';
import { FieldsGuideTab } from '@/components/fields/FieldsGuideTab';
import { Plus, Loader2, Mountain, Leaf } from 'lucide-react';
import { format } from 'date-fns';
import type { Field } from '@/hooks/useFields';
import { FieldsGuidedTour } from '@/components/fields/FieldsGuidedTour';

export function EmbeddedFieldsTab() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { fields, isLoading: fieldsLoading, addField, deleteField } = useFields();
  const { seasons, createSeason, updateSeason } = useCropSeasons();
  const { activeCrops } = useCrops();

  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isSoilTestOpen, setIsSoilTestOpen] = useState(false);
  const [highlightFieldId, setHighlightFieldId] = useState<string | null>(null);

  if (authLoading || fieldsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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

  const handleEndSeason = (seasonId: string) => {
    updateSeason(seasonId, {
      is_active: false,
      season_end_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="px-4 pt-4 pb-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            {language === 'ne' ? 'मेरो खेत' : 'My Field'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {language === 'ne' ? 'खेत र बाली व्यवस्थापन' : 'Field & Crop Management'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FieldsGuidedTour />
          <Button className="gap-1.5 h-10 px-4" onClick={() => setIsAddFieldOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('newField')}</span>
            <span className="sm:hidden">{t('addShort')}</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-12 mb-5">
          <TabsTrigger value="fields" className="text-sm gap-2 font-semibold">
            🌾 {language === 'ne' ? 'खेतहरू' : 'Fields'}
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-sm gap-2 font-semibold">
            📘 {language === 'ne' ? 'गाइड' : 'Guide'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-0">
          {fields.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Mountain className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-semibold mb-1 text-base">
                  {language === 'ne' ? 'अझै कुनै खेत थपिएको छैन' : 'No fields yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ne' ? 'तपाईंको पहिलो खेत थप्नुहोस्' : 'Add your first field to get started'}
                </p>
                <Button onClick={() => setIsAddFieldOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('addFirstField')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <TodaySummaryBanner seasons={seasons} fieldCount={fields.length} />
              <h2 className="text-sm font-semibold text-muted-foreground">
                {language === 'ne' ? 'खेतहरू' : 'Fields'} ({fields.length})
              </h2>
              <div className="space-y-3">
                {fields.map(field => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    seasons={seasons}
                    crops={activeCrops}
                    isSelected={selectedField?.id === field.id}
                    isHighlighted={highlightFieldId === field.id}
                    onSelect={() => setSelectedField(prev => prev?.id === field.id ? null : field)}
                    onDelete={() => handleDeleteField(field.id)}
                  />
                ))}
              </div>
              {selectedField && (
                <FieldDetailPanel
                  field={selectedField}
                  seasons={seasons}
                  crops={activeCrops}
                  onAddCrop={() => setIsAddSeasonOpen(true)}
                  onSoilTest={() => setIsSoilTestOpen(true)}
                  onEndSeason={handleEndSeason}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guide" className="mt-0">
          <FieldsGuideTab seasons={seasons} crops={activeCrops} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddFieldDialog
        open={isAddFieldOpen}
        onOpenChange={setIsAddFieldOpen}
        onSubmit={async (data) => {
          const result = await addField(data);
          if (result) {
            setSelectedField(result as Field);
            setHighlightFieldId((result as Field).id);
            setTimeout(() => setHighlightFieldId(null), 3000);
          }
          return result;
        }}
        onCreateSeason={async (seasonData) => {
          await createSeason({
            field_id: seasonData.field_id,
            crop_name: seasonData.crop_name,
            variety: seasonData.variety,
            season_start_date: seasonData.season_start_date,
            season_end_date: null,
            expected_yield: seasonData.expected_yield,
            actual_yield: null,
            notes: seasonData.notes,
            is_active: true,
          });
        }}
      />

      <AddCropSeasonModal
        isOpen={isAddSeasonOpen}
        onClose={() => setIsAddSeasonOpen(false)}
        onSubmit={handleCreateSeason}
        fieldName={selectedField?.name}
      />

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
    </div>
  );
}
