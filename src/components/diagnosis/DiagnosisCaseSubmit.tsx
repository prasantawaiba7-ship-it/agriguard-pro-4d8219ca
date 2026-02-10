import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, Send, Leaf, Bug, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCrops } from '@/hooks/useCrops';
import { useSubmitDiagnosisCase } from '@/hooks/useDiagnosisCases';
import { uploadDiseaseImage } from '@/lib/uploadDiseaseImage';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/hooks/useLanguage';

type DiagnosisAngleType = Database['public']['Enums']['diagnosis_angle_type'];

interface UploadedImage {
  dataUrl: string;
  url?: string;
  angleType: DiagnosisAngleType;
}

export function DiagnosisCaseSubmit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCrops: crops } = useCrops();
  const submitCase = useSubmitDiagnosisCase();
  const { t, language } = useLanguage();

  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const angleTypeLabels: Record<DiagnosisAngleType, string> = {
    leaf_closeup: t('leafCloseup'),
    plant_full: t('plantFull'),
    fruit: t('fruitFlower'),
    stem: t('stemRoot'),
    other: t('other')
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (images.length + files.length > 3) {
      toast({
        title: t('max3Photos'),
        description: t('max3Photos'),
        variant: 'destructive'
      });
      return;
    }

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImages(prev => [...prev, { dataUrl, angleType: 'other' }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateAngleType = (index: number, angleType: DiagnosisAngleType) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, angleType } : img
    ));
  };

  const handleSubmit = async () => {
    if (!selectedCropId) {
      toast({
        title: t('selectCropLabel'),
        description: t('selectCropLabel'),
        variant: 'destructive'
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: t('photoRequired'),
        description: t('upload1Photo'),
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload all images to storage
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          const url = await uploadDiseaseImage(img.dataUrl, user?.id);
          return { url, angleType: img.angleType };
        })
      );

      // Submit case
      await submitCase.mutateAsync({
        cropId: parseInt(selectedCropId),
        farmerQuestion: farmerQuestion || undefined,
        images: uploadedImages
      });

      // Reset form
      setSelectedCropId('');
      setFarmerQuestion('');
      setImages([]);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="w-5 h-5 text-primary" />
          🌿 {t('submitDiagnosis')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('submitSubtitle')}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-success/10 border border-success/30 rounded-xl text-center"
            >
              <p className="font-medium text-success">✅ {t('caseSubmitted')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('expertWillNotify')}
              </p>
              <p className="text-xs text-warning mt-2 flex items-center justify-center gap-1">
                <HelpCircle className="w-3 h-3" />
                {t('preliminaryNote')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Select Crop */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t('selectCropLabel')}
          </label>
          <Select value={selectedCropId} onValueChange={setSelectedCropId}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectCropPlaceholder2')} />
            </SelectTrigger>
            <SelectContent>
              {crops?.map(crop => (
                <SelectItem key={crop.id} value={crop.id.toString()}>
                  {language === 'ne' ? crop.name_ne : crop.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Photo Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t('uploadPhotoLabel')}
          </label>
          
          {/* Upload Buttons */}
          <div className="flex gap-2 mb-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={images.length >= 3}
            >
              <Camera className="w-4 h-4 mr-1" />
              {t('camera')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 3}
            >
              <Upload className="w-4 h-4 mr-1" />
              {t('gallery')}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img.dataUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <Select
                    value={img.angleType}
                    onValueChange={(v) => updateAngleType(index, v as DiagnosisAngleType)}
                  >
                    <SelectTrigger className="mt-1 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(angleTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
              <Leaf className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('uploadPhotoSubtext')}
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Optional Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t('describeIssueLabel')}
          </label>
          <Textarea
            placeholder={t('describePlaceholder')}
            value={farmerQuestion}
            onChange={(e) => setFarmerQuestion(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>{t('importantTipsTitle')}</strong> {t('submitDisclaimer')}
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isUploading || submitCase.isPending || !selectedCropId || images.length === 0}
          className="w-full"
          size="lg"
        >
          {isUploading || submitCase.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t('submitCase')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}