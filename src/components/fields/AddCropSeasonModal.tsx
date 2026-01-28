import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RegionCropSelector } from './RegionCropSelector';
import { Crop } from '@/hooks/useCrops';
import { format } from 'date-fns';
import { ChevronLeft, Sprout, Calendar, ArrowRight } from 'lucide-react';

interface AddCropSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    crop_name: string;
    crop_id?: number;
    variety: string | null;
    season_start_date: string;
    expected_yield: number | null;
    notes: string | null;
  }) => Promise<void>;
  fieldName?: string;
}

type Step = 'crop_select' | 'details';

export function AddCropSeasonModal({
  isOpen,
  onClose,
  onSubmit,
  fieldName,
}: AddCropSeasonModalProps) {
  const [step, setStep] = useState<Step>('crop_select');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [variety, setVariety] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expectedYield, setExpectedYield] = useState('');
  const [notes, setNotes] = useState('');

  const handleCropSelect = (crop: Crop) => {
    setSelectedCrop(crop);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedCrop) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        crop_name: selectedCrop.name_ne,
        crop_id: selectedCrop.id,
        variety: variety.trim() || null,
        season_start_date: startDate,
        expected_yield: expectedYield ? parseFloat(expectedYield) : null,
        notes: notes.trim() || null,
      });
      
      // Reset form
      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to create season:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('crop_select');
    setSelectedCrop(null);
    setVariety('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setExpectedYield('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            {step === 'crop_select' ? 'बाली छान्नुहोस्' : 'बाली विवरण'}
            {fieldName && (
              <span className="text-sm font-normal text-muted-foreground">
                • {fieldName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'crop_select' ? (
          <RegionCropSelector
            onCropSelect={handleCropSelect}
            selectedCropId={selectedCrop?.id}
          />
        ) : (
          <div className="space-y-4 pt-2">
            {/* Back button and selected crop display */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setStep('crop_select')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {selectedCrop?.image_url ? (
                <img
                  src={selectedCrop.image_url}
                  alt={selectedCrop.name_ne}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sprout className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div>
                <p className="font-semibold">{selectedCrop?.name_ne}</p>
                <p className="text-xs text-muted-foreground">{selectedCrop?.name_en}</p>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <Label>जात (variety)</Label>
                <Input
                  placeholder="जस्तै: hybrid, local, srijana..."
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  रोपेको मिति
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label>अपेक्षित उत्पादन (क्विन्टल)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(e.target.value)}
                />
              </div>

              <div>
                <Label>नोट</Label>
                <Textarea
                  placeholder="थप जानकारी..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full gap-2"
            >
              {isSubmitting ? (
                'सेभ हुँदैछ...'
              ) : (
                <>
                  बाली थप्नुहोस्
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
