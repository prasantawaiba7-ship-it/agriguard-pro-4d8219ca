import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, X, Loader2, Send, Mic, MicOff, 
  Bot, MapPin, AlertTriangle, CheckCircle2, Leaf, Building2, User, Phone, Mail, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useAgOffices, useTechnicians, useCreateExpertTicket, uploadExpertImage } from '@/hooks/useExpertTickets';

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

type FormStep = 'office' | 'technician' | 'details';

export function AskExpertForm({ prefill, onSubmitted }: AskExpertFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const createTicket = useCreateExpertTicket();

  const [formStep, setFormStep] = useState<FormStep>('office');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [cropName, setCropName] = useState(prefill?.cropName || '');
  const [problemTitle, setProblemTitle] = useState(
    prefill?.aiDisease ? `${prefill.aiDisease}` : ''
  );
  const [farmerQuestion, setFarmerQuestion] = useState('');
  const [images, setImages] = useState<{ dataUrl: string; file?: File }[]>(
    prefill?.imageDataUrl ? [{ dataUrl: prefill.imageDataUrl }] : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: offices, isLoading: officesLoading } = useAgOffices();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians(selectedOfficeId);

  const selectedOffice = offices?.find(o => o.id === selectedOfficeId);
  const selectedTechnician = technicians?.find(t => t.id === selectedTechnicianId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Voice input
  const { isListening, isSupported: voiceSupported, interimTranscript, startListening, stopListening } = useVoiceInput({
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
        setImages(prev => [...prev, { dataUrl, file }]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedOfficeId || !selectedTechnicianId) return;
    if (!problemTitle.trim()) {
      toast({ title: 'समस्याको शीर्षक लेख्नुहोस्', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadExpertImage(img.file);
          imageUrls.push(url);
        } else if (img.dataUrl) {
          // Convert dataUrl to file for upload
          const res = await fetch(img.dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = await uploadExpertImage(file);
          imageUrls.push(url);
        }
      }

      // Build description
      const descParts: string[] = [];
      if (farmerQuestion) descParts.push(farmerQuestion);
      if (prefill?.aiDisease) {
        descParts.push(`\n--- AI विश्लेषण ---\nरोग: ${prefill.aiDisease} (${Math.round((prefill.aiConfidence || 0) * 100)}%)`);
        if (prefill.aiRecommendation) descParts.push(`सिफारिस: ${prefill.aiRecommendation}`);
      }

      await createTicket.mutateAsync({
        officeId: selectedOfficeId,
        technicianId: selectedTechnicianId,
        cropName: cropName || 'N/A',
        problemTitle: problemTitle.trim(),
        problemDescription: descParts.join(' ') || problemTitle.trim(),
        imageUrls,
      });

      setShowSuccess(true);
      setCropName('');
      setProblemTitle('');
      setFarmerQuestion('');
      setImages([]);
      setFormStep('office');
      setSelectedOfficeId(null);
      setSelectedTechnicianId(null);
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
            <Card className="border-2 border-primary/40 bg-primary/5">
              <CardContent className="p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
                <p className="text-base font-semibold text-foreground">
                  ✅ तपाईंको प्रश्न पठाइयो!
                </p>
                {selectedTechnician && selectedOffice && (
                  <p className="text-sm text-muted-foreground">
                    पठाइएको: <strong>{selectedTechnician.name}</strong> ({selectedOffice.name})
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  जवाफ आएपछि सूचना पाउनुहुनेछ।
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-2">
        {(['office', 'technician', 'details'] as FormStep[]).map((s, i) => {
          const idx = ['office', 'technician', 'details'].indexOf(formStep);
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                formStep === s ? 'bg-primary text-primary-foreground' :
                idx > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>{i + 1}</div>
              {i < 2 && <div className="w-6 h-0.5 bg-border" />}
            </div>
          );
        })}
        <span className="text-xs text-muted-foreground ml-2">
          {formStep === 'office' ? 'कार्यालय' : formStep === 'technician' ? 'प्राविधिक' : 'विवरण'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Office */}
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
                        onClick={() => {
                          setSelectedOfficeId(office.id);
                          setSelectedTechnicianId(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedOfficeId === office.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="font-semibold text-sm text-foreground">{office.name}</p>
                        <p className="text-xs text-muted-foreground">{office.district}</p>
                        {office.contact_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {office.contact_phone}
                          </p>
                        )}
                      </div>
                    ))}
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      disabled={!selectedOfficeId}
                      onClick={() => setFormStep('technician')}
                    >
                      अर्को <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-sm">कुनै कार्यालय उपलब्ध छैन।</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Select Technician */}
        {formStep === 'technician' && (
          <motion.div key="technician" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  कृषि प्राविधिक छान्नुहोस्
                </h2>
                <p className="text-xs text-muted-foreground">
                  कार्यालय: <strong>{selectedOffice?.name}</strong> • तपाईंको प्रश्न छानिएको प्राविधिकलाई मात्र पठाइनेछ।
                </p>
                {techniciansLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : technicians && technicians.length > 0 ? (
                  <div className="space-y-2">
                    {technicians.map(tech => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechnicianId(tech.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedTechnicianId === tech.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <p className="font-semibold text-sm text-foreground">कृषि प्राविधिक: {tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.role_title}</p>
                        {tech.specialization && (
                          <p className="text-xs text-muted-foreground mt-0.5">विशेषज्ञता: {tech.specialization}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {tech.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {tech.phone}
                            </span>
                          )}
                          {tech.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {tech.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setFormStep('office')} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                      </Button>
                      <Button size="sm" className="flex-1" disabled={!selectedTechnicianId} onClick={() => setFormStep('details')}>
                        अर्को <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-sm text-muted-foreground">यस कार्यालयमा सक्रिय प्राविधिक उपलब्ध छैन।</p>
                    <Button variant="outline" size="sm" onClick={() => setFormStep('office')}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> अर्को कार्यालय छान्नुहोस्
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Problem Details */}
        {formStep === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  समस्या पठाउनुहोस्
                </h2>
                <p className="text-xs text-muted-foreground">
                  पठाउने: <strong>{selectedTechnician?.name}</strong>, {selectedOffice?.name}
                </p>

                {/* AI Report Summary */}
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
                  <label className="text-sm font-medium mb-2 block text-foreground">📷 फोटो ({images.length}/3)</label>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {images.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border/40">
                          <img src={img.dataUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          <Button variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 rounded-full" onClick={() => removeImage(index)}>
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

                {/* Crop Name */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">🌱 बालीको नाम</label>
                  <Input placeholder="जस्तै: धान, गहुँ, तरकारी..." value={cropName} onChange={e => setCropName(e.target.value)} />
                </div>

                {/* Problem Title */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-foreground">समस्याको शीर्षक *</label>
                  <Input placeholder="जस्तै: पातमा पहेंलो दाग" value={problemTitle} onChange={e => setProblemTitle(e.target.value)} required />
                </div>

                {/* Description + Voice */}
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground">समस्या बताउनुहोस्</label>
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
                    <Button variant={isListening ? 'destructive' : 'outline'} size="sm" className="mt-2" onClick={isListening ? stopListening : startListening}>
                      {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                      {isListening ? 'बन्द गर्नुहोस्' : 'आवाजमा बताउनुहोस्'}
                    </Button>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setFormStep('technician')} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isUploading || createTicket.isPending || !problemTitle.trim()}
                    className="flex-1"
                    size="sm"
                  >
                    {isUploading || createTicket.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />पठाउँदैछ...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />विज्ञलाई पठाउनुहोस्</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
