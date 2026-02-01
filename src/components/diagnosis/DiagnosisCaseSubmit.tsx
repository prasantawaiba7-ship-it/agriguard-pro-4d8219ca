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

type DiagnosisAngleType = Database['public']['Enums']['diagnosis_angle_type'];

interface UploadedImage {
  dataUrl: string;
  url?: string;
  angleType: DiagnosisAngleType;
}

const angleTypeLabels: Record<DiagnosisAngleType, string> = {
  leaf_closeup: 'पातको नजिकको फोटो',
  plant_full: 'पूरा बिरुवा',
  fruit: 'फल/फूल',
  stem: 'डाँठ/गाँठ',
  other: 'अन्य'
};

export function DiagnosisCaseSubmit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCrops: crops } = useCrops();
  const submitCase = useSubmitDiagnosisCase();

  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (images.length + files.length > 3) {
      toast({
        title: 'अधिकतम ३ फोटो मात्र',
        description: 'कृपया ३ वटा भन्दा बढी फोटो नराख्नुहोस्।',
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
        title: 'बाली छान्नुहोस्',
        description: 'कृपया पहिले बाली छान्नुहोस्।',
        variant: 'destructive'
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'फोटो आवश्यक छ',
        description: 'कम्तीमा १ वटा फोटो अपलोड गर्नुहोस्।',
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
          🌿 रोग/किरा जाँच पठाउनुहोस्
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          फोटो खिचेर पठाउनुहोस्, कृषि विज्ञले उत्तर दिनुहुनेछ।
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
              <p className="font-medium text-success">✅ केस सफलतापूर्वक पठाइयो!</p>
              <p className="text-sm text-muted-foreground mt-1">
                कृषि विज्ञको उत्तर आएपछि तपाईंलाई सूचना दिइनेछ।
              </p>
              <p className="text-xs text-warning mt-2 flex items-center justify-center gap-1">
                <HelpCircle className="w-3 h-3" />
                यो केवल प्रारम्भिक अनुमान हो, अन्तिम सल्लाह विज्ञले हेरेपछि आउनेछ।
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Select Crop */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            १. बाली छान्नुहोस् *
          </label>
          <Select value={selectedCropId} onValueChange={setSelectedCropId}>
            <SelectTrigger>
              <SelectValue placeholder="बाली छान्नुहोस्..." />
            </SelectTrigger>
            <SelectContent>
              {crops?.map(crop => (
                <SelectItem key={crop.id} value={crop.id.toString()}>
                  {crop.name_ne} ({crop.name_en})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Photo Upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            २. फोटो खिच्नुहोस् / अपलोड गर्नुहोस् * (१-३ वटा)
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
              क्यामेरा
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 3}
            >
              <Upload className="w-4 h-4 mr-1" />
              गेलेरी
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
                पात, फल, वा बिरुवाको फोटो अपलोड गर्नुहोस्
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Optional Description */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            ३. समस्या छोटकरीमा लेख्नुहोस् (ऐच्छिक)
          </label>
          <Textarea
            placeholder="जस्तै: पात पहेंलो भयो, काला दाग परेको छ, कीरा देखियो..."
            value={farmerQuestion}
            onChange={(e) => setFarmerQuestion(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>नोट:</strong> यो प्रणालीले प्रारम्भिक अनुमान मात्र दिन्छ। 
            अन्तिम निदान र उपचार कृषि विज्ञको जाँचपछि मात्र निश्चित हुन्छ।
            रसायन प्रयोग विज्ञको सल्लाहपछि मात्र गर्नुहोस्।
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
              पठाउँदै...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              केस पठाउनुहोस्
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
