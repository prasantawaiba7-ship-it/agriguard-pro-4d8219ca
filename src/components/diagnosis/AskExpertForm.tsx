import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, X, Loader2, Send, Mic, MicOff, 
  Bot, Building2, User, Phone, Mail, ArrowRight, ArrowLeft, Leaf, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useAgOffices, useCreateExpertTicket, uploadExpertImage } from '@/hooks/useExpertTickets';

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

// Admin triage: farmer only selects office, technician assigned by admin later
type FormStep = 'problem' | 'office' | 'done';

export function AskExpertForm({ prefill, onSubmitted }: AskExpertFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const createTicket = useCreateExpertTicket();

  const [formStep, setFormStep] = useState<FormStep>('problem');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [cropName, setCropName] = useState(prefill?.cropName || '');
  const [problemTitle, setProblemTitle] = useState(prefill?.aiDisease || '');
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [images, setImages] = useState<{ dataUrl: string; file?: File }[]>(
    prefill?.imageDataUrl ? [{ dataUrl: prefill.imageDataUrl }] : []
  );
  const [isUploading, setIsUploading] = useState(false);

  const { data: offices, isLoading: officesLoading } = useAgOffices();

  const selectedOffice = offices?.find(o => o.id === selectedOfficeId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSupported: voiceSupported, interimTranscript, startListening, stopListening } = useVoiceInput({
    language,
    onResult: (text) => setFarmerQuestion(prev => prev ? `${prev} ${text}` : text),
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
        setImages(prev => [...prev, { dataUrl, file }]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const canProceedFromProblem = problemTitle.trim().length > 0;

  const handleSubmit = async () => {
    if (!selectedOfficeId || !problemTitle.trim()) return;
    setIsUploading(true);
    try {
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          imageUrls.push(await uploadExpertImage(img.file));
        } else if (img.dataUrl) {
          const res = await fetch(img.dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          imageUrls.push(await uploadExpertImage(file));
        }
      }

      const descParts: string[] = [];
      if (farmerQuestion) descParts.push(farmerQuestion);
      if (prefill?.aiDisease) {
        descParts.push(`\n--- AI विश्लेषण ---\nरोग: ${prefill.aiDisease} (${Math.round((prefill.aiConfidence || 0) * 100)}%)`);
        if (prefill.aiRecommendation) descParts.push(`सिफारिस: ${prefill.aiRecommendation}`);
      }

      // Admin triage: submit with technician_id = null
      await createTicket.mutateAsync({
        officeId: selectedOfficeId,
        technicianId: null,
        cropName: cropName || 'N/A',
        problemTitle: problemTitle.trim(),
        problemDescription: descParts.join(' ') || problemTitle.trim(),
        imageUrls,
      });

      setFormStep('done');
      onSubmitted?.();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCropName('');
    setProblemTitle('');
    setFarmerQuestion('');
    setImages([]);
    setSelectedOfficeId(null);
    setSelectedTechnicianId(null);
    setFormStep('problem');
  };

  // Admin triage: only 2 steps now (problem + office)
  const stepIndex = ['problem', 'office'].indexOf(formStep);
  const stepLabels = ['समस्या', 'कार्यालय'];

  return (
    <div className="space-y-4">
      {/* Step indicators */}
      {formStep !== 'done' && (
        <div className="flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                stepIndex === i ? 'bg-primary text-primary-foreground' :
                stepIndex > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>{i + 1}</div>
              {i < 1 && <div className="w-5 h-0.5 bg-border" />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{stepLabels[stepIndex] || ''}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Problem details (crop, photo, title, description) */}
        {formStep === 'problem' && (
          <motion.div key="problem" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  समस्या विवरण भर्नुहोस्
                </h2>

                {/* AI prefill summary */}
                {prefill?.aiDisease && (
                  <div className="p-3 bg-muted/60 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">AI विश्लेषण (स्वचालित संलग्न)</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {prefill.aiDisease} — {Math.round((prefill.aiConfidence || 0) * 100)}%
                    </p>
                  </div>
                )}

                {/* Photos */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">📷 फोटो ({images.length}/3)</label>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border/40">
                          <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                          <Button variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 rounded-full" onClick={() => removeImage(index)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => cameraInputRef.current?.click()}>
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

                {/* Crop name */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">🌱 बालीको नाम</label>
                  <Input placeholder="जस्तै: धान, गहुँ, तरकारी..." value={cropName} onChange={e => setCropName(e.target.value)} />
                </div>

                {/* Problem title */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">समस्याको शीर्षक *</label>
                  <Input placeholder="जस्तै: पातमा पहेंलो दाग" value={problemTitle} onChange={e => setProblemTitle(e.target.value)} />
                </div>

                {/* Description + voice */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">विस्तृत विवरण</label>
                  <Textarea
                    placeholder="बालीमा के भइरहेको छ? कति दिन भयो?"
                    value={farmerQuestion}
                    onChange={(e) => setFarmerQuestion(e.target.value)}
                    rows={3}
                    className="resize-none text-base"
                  />
                  {interimTranscript && <p className="text-xs text-primary mt-1 animate-pulse">🎤 {interimTranscript}</p>}
                  {voiceSupported && (
                    <Button variant={isListening ? 'destructive' : 'outline'} size="sm" className="mt-2" onClick={isListening ? stopListening : startListening}>
                      {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                      {isListening ? 'बन्द' : 'आवाजमा बताउनुहोस्'}
                    </Button>
                  )}
                </div>

                <Button className="w-full" disabled={!canProceedFromProblem} onClick={() => setFormStep('office')}>
                  अर्को: कार्यालय छान्नुहोस् <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Office */}
        {formStep === 'office' && (
          <motion.div key="office" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  कृषि कार्यालय छान्नुहोस्
                </h2>
                {officesLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : offices && offices.length > 0 ? (
                  <div className="space-y-2">
                    {offices.map(office => (
                      <div
                        key={office.id}
                        onClick={() => { setSelectedOfficeId(office.id); setSelectedTechnicianId(null); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedOfficeId === office.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="font-semibold text-sm text-foreground">{office.name}</p>
                        <p className="text-xs text-muted-foreground">{office.district}</p>
                        {office.contact_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {office.contact_phone}</p>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setFormStep('problem')} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!selectedOfficeId || isUploading || createTicket.isPending}
                        onClick={handleSubmit}
                      >
                        {isUploading || createTicket.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />पठाउँदैछ...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-1" />पठाउनुहोस्</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-sm">कुनै कार्यालय उपलब्ध छैन।</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Done */}
        {formStep === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-2 border-primary/40 bg-primary/5">
              <CardContent className="p-5 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
                <p className="text-base font-semibold text-foreground">✅ प्रश्न पठाइयो!</p>
                <p className="text-sm text-muted-foreground">
                  कार्यालय: <strong>{selectedOffice?.name}</strong>
                </p>
                <p className="text-xs text-primary/80 font-medium">
                  कृषि प्राविधिकले चाँडै हेर्नेछन् र जवाफ दिनेछन्।
                </p>
                <p className="text-xs text-muted-foreground">जवाफ आएपछि यहाँ पनि देख्न सक्नुहुन्छ।</p>
                <Button variant="outline" size="sm" onClick={resetForm}>अर्को प्रश्न सोध्नुहोस्</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
