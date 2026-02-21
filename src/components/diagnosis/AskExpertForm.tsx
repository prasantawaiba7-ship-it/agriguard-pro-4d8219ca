import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, X, Loader2, Send, Mic, MicOff, 
  Bot, MapPin, AlertTriangle, CheckCircle2, Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCrops } from '@/hooks/useCrops';
import { useSubmitDiagnosisCase } from '@/hooks/useDiagnosisCases';
import { uploadDiseaseImage } from '@/lib/uploadDiseaseImage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useLocationData } from '@/hooks/useLocationData';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import type { Database } from '@/integrations/supabase/types';

type DiagnosisAngleType = Database['public']['Enums']['diagnosis_angle_type'];

interface AiPrefill {
  imageDataUrl?: string;
  cropName?: string;
  cropId?: number;
  aiDisease?: string;
  aiConfidence?: number;
  aiRecommendation?: string;
}

interface AskExpertFormProps {
  prefill?: AiPrefill;
  onSubmitted?: () => void;
}

const PROBLEM_TYPES = [
  { value: 'disease', label: 'रोग (Disease)' },
  { value: 'pest', label: 'कीरा (Pest)' },
  { value: 'nutrition', label: 'पोषण (Nutrition)' },
  { value: 'weather', label: 'मौसम (Weather)' },
  { value: 'market', label: 'बजार (Market)' },
  { value: 'other', label: 'अन्य (Other)' },
];

export function AskExpertForm({ prefill, onSubmitted }: AskExpertFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCrops: crops } = useCrops();
  const submitCase = useSubmitDiagnosisCase();
  const { language } = useLanguage();
  const { 
    provinces, districts, 
    selectedProvinceId, selectedDistrictId,
    handleProvinceChange, handleDistrictChange 
  } = useLocationData();

  const [selectedCropId, setSelectedCropId] = useState<string>(
    prefill?.cropId ? prefill.cropId.toString() : ''
  );
  const [problemType, setProblemType] = useState<string>(prefill?.aiDisease ? 'disease' : '');
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [images, setImages] = useState<{ dataUrl: string; angleType: DiagnosisAngleType }[]>(
    prefill?.imageDataUrl ? [{ dataUrl: prefill.imageDataUrl, angleType: 'leaf_closeup' }] : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voice input
  const { isListening, isSupported: voiceSupported, transcript, interimTranscript, startListening, stopListening } = useVoiceInput({
    language,
    onResult: (text) => {
      setFarmerQuestion(prev => prev ? `${prev} ${text}` : text);
    },
    onError: (err) => toast({ title: err, variant: 'destructive' }),
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    if (images.length + files.length > 3) {
      toast({ title: 'बढीमा ३ फोटो मात्र', variant: 'destructive' });
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
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedCropId) {
      toast({ title: 'बाली छान्नुहोस्', variant: 'destructive' });
      return;
    }
    if (images.length === 0) {
      toast({ title: 'कम्तिमा १ फोटो चाहिन्छ', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          const url = await uploadDiseaseImage(img.dataUrl, user?.id);
          return { url, angleType: img.angleType };
        })
      );

      // Build question text (description only, structured fields stored separately)
      const questionParts: string[] = [];
      if (farmerQuestion) questionParts.push(farmerQuestion);
      if (prefill?.aiDisease) {
        questionParts.push(`\n--- AI विश्लेषण ---\nरोग: ${prefill.aiDisease} (${Math.round((prefill.aiConfidence || 0) * 100)}%)`);
        if (prefill.aiRecommendation) questionParts.push(`सिफारिस: ${prefill.aiRecommendation}`);
      }

      const result = await submitCase.mutateAsync({
        cropId: parseInt(selectedCropId),
        farmerQuestion: questionParts.join(' ') || undefined,
        problemType: problemType || undefined,
        priority,
        channel: 'APP',
        provinceId: selectedProvinceId || undefined,
        districtId: selectedDistrictId || undefined,
        images: uploadedImages,
      });

      // Create initial case_message for the thread
      if (farmerQuestion || prefill?.aiDisease) {
        await supabase.from('case_messages').insert({
          case_id: result.id,
          sender_type: 'farmer',
          sender_id: user?.id || null,
          message_text: farmerQuestion || `AI विश्लेषण: ${prefill?.aiDisease}`,
          attachments: uploadedImages.map(img => ({ type: 'image', url: img.url })),
        });
      }

      // Auto-route the case
      try {
        await supabase.rpc('auto_route_case', { p_case_id: result.id });
      } catch (e) {
        console.warn('Auto-routing skipped:', e);
      }

      setSubmittedCaseId(result.id);
      setShowSuccess(true);
      setSelectedCropId('');
      setFarmerQuestion('');
      setImages([]);
      setProblemType('');
      setPriority('normal');
      onSubmitted?.();

      setTimeout(() => setShowSuccess(false), 8000);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Success Confirmation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-2 border-success/40 bg-success/5">
              <CardContent className="p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-success" />
                <p className="text-base font-semibold text-foreground">
                  ✅ तपाईंको प्रश्न विज्ञलाई पठाइयो!
                </p>
                {submittedCaseId && (
                  <p className="text-sm text-muted-foreground">
                    केस ID: <span className="font-mono font-medium">KS-{submittedCaseId.slice(0, 8).toUpperCase()}</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  स्थिति: <Badge variant="outline" className="ml-1 text-xs">नयाँ</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  औसत जवाफ समय: लगभग २४ घण्टा (कार्यालय समयमा)
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section: समस्या पठाउनुहोस् */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            समस्या पठाउनुहोस्
          </h2>

          {/* AI Report Summary (if prefilled) */}
          {prefill?.aiDisease && (
            <div className="p-3 bg-muted/60 rounded-xl border border-border/40">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">AI विश्लेषण (स्वचालित संलग्न)</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {prefill.aiDisease} — सम्भावना {Math.round((prefill.aiConfidence || 0) * 100)}%
              </p>
              {prefill.aiRecommendation && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  सिफारिस: {prefill.aiRecommendation}
                </p>
              )}
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">
              📷 फोटो ({images.length}/3)
            </label>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border/40">
                    <img src={img.dataUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">बिरामी बालीको फोटो खिच्नुहोस्</p>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={images.length >= 3}>
                <Camera className="w-4 h-4 mr-1" /> क्यामेरा
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={images.length >= 3}>
                <Upload className="w-4 h-4 mr-1" /> ग्यालेरी
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
          </div>

          {/* Crop Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">🌱 बाली</label>
            <Select value={selectedCropId} onValueChange={setSelectedCropId}>
              <SelectTrigger>
                <SelectValue placeholder="बाली छान्नुहोस्" />
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

          {/* Problem Type */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">समस्या के हो?</label>
            <div className="flex flex-wrap gap-2">
              {PROBLEM_TYPES.map(pt => (
                <button
                  key={pt.value}
                  onClick={() => setProblemType(pt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    problemType === pt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 text-foreground border-border/40 hover:border-primary/40'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">
                <MapPin className="w-3 h-3 inline mr-1" />प्रदेश
              </label>
              <Select
                value={selectedProvinceId?.toString() || ''}
                onValueChange={(v) => handleProvinceChange(v ? parseInt(v) : null)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="प्रदेश" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()} className="text-sm">
                      {p.name_ne}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block text-muted-foreground">जिल्ला</label>
              <Select
                value={selectedDistrictId?.toString() || ''}
                onValueChange={(v) => handleDistrictChange(v ? parseInt(v) : null)}
                disabled={!selectedProvinceId}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="जिल्ला" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()} className="text-sm">
                      {d.name_ne}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description + Voice */}
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">
              समस्या बताउनुहोस्
            </label>
            <Textarea
              placeholder="बालीमा के भइरहेको छ? कति दिन भयो? कुन भागमा समस्या छ?"
              value={farmerQuestion}
              onChange={(e) => setFarmerQuestion(e.target.value)}
              rows={3}
              className="resize-none text-base"
            />
            {interimTranscript && (
              <p className="text-xs text-primary mt-1 animate-pulse">🎤 {interimTranscript}</p>
            )}
            {voiceSupported && (
              <Button
                variant={isListening ? 'destructive' : 'outline'}
                size="sm"
                className="mt-2"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                {isListening ? 'बन्द गर्नुहोस्' : 'आवाजमा बताउनुहोस्'}
              </Button>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium mb-2 block text-muted-foreground">प्राथमिकता</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriority('normal')}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  priority === 'normal'
                    ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                    : 'bg-muted/30 text-muted-foreground border-border/30'
                }`}
              >
                सामान्य
              </button>
              <button
                onClick={() => setPriority('urgent')}
                className={`px-4 py-2 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                  priority === 'urgent'
                    ? 'bg-destructive/10 text-destructive border-destructive/30 font-medium'
                    : 'bg-muted/30 text-muted-foreground border-border/30'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                अत्यावश्यक
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              औसत जवाफ समय: लगभग २४ घण्टा (कार्यालय समयमा)।
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isUploading || submitCase.isPending || !selectedCropId || images.length === 0}
            className="w-full"
            size="lg"
          >
            {isUploading || submitCase.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                पठाउँदैछ...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                विज्ञलाई पठाउनुहोस्
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
