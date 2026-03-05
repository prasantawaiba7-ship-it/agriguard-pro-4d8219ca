import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAgOffices, useTechnicians, useCreateExpertTicket } from '@/hooks/useExpertTickets';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { AudioRecorder } from '@/components/media/AudioRecorder';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';
import {
  ArrowLeft, ArrowRight, Building2, Send, Camera, Upload, X, Loader2,
  Phone, CheckCircle2, User, Mail, Leaf, Bug, Droplets, Beaker, HelpCircle,
  Mic, MicOff, Video, Sparkles
} from 'lucide-react';

type Step = 'form' | 'office' | 'technician' | 'done';

const CATEGORIES = [
  { value: 'रोग', icon: <Bug className="w-4 h-4" />, label: 'रोग' },
  { value: 'कीरा', icon: <Bug className="w-4 h-4" />, label: 'कीरा' },
  { value: 'मल', icon: <Beaker className="w-4 h-4" />, label: 'मल' },
  { value: 'सिँचाइ', icon: <Droplets className="w-4 h-4" />, label: 'सिँचाइ' },
  { value: 'अन्य', icon: <HelpCircle className="w-4 h-4" />, label: 'अन्य' },
];

const PHOTO_TIPS = [
  '✔ पात नजिकबाट फोटो लिनुहोस्',
  '✔ स्पष्ट फोटो पठाउनुहोस्',
  '✔ राम्रो प्रकाशमा खिच्नुहोस्',
];

export default function AskExpertPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>('form');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [cropName, setCropName] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [category, setCategory] = useState('रोग');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<{ blob: Blob; duration: number } | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: offices, isLoading: officesLoading } = useAgOffices();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians(selectedOfficeId);
  const createTicket = useCreateExpertTicket();

  const selectedOffice = offices?.find(o => o.id === selectedOfficeId);
  const selectedTechnician = technicians?.find(t => t.id === selectedTechnicianId);

  const { isListening, isSupported: voiceSupported, interimTranscript, startListening, stopListening } = useVoiceInput({
    language,
    onResult: (text) => setProblemDescription(prev => prev ? `${prev} ${text}` : text),
    onError: (err) => toast({ title: err, variant: 'destructive' }),
  });

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selectedOfficeId || !selectedTechnicianId || !problemTitle.trim() || !problemDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const descParts = [`[${category}] ${problemDescription}`];
      const ticket = await createTicket.mutateAsync({
        officeId: selectedOfficeId,
        technicianId: selectedTechnicianId,
        cropName: cropName || 'N/A',
        problemTitle: problemTitle.trim(),
        problemDescription: descParts.join(' '),
      });

      if (imageFiles.length > 0 && ticket?.id && user) {
        const { uploadTicketImage } = await import('@/hooks/useTicketImages');
        for (const file of imageFiles) {
          await uploadTicketImage(ticket.id, file, user.id, 'farmer');
        }
      }

      if (voiceBlob && ticket?.id && user) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: msgs } = await (supabase as any)
          .from('expert_ticket_messages').select('id').eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true }).limit(1);
        if (msgs?.length) {
          const { uploadTicketMedia } = await import('@/hooks/useTicketMedia');
          await uploadTicketMedia(ticket.id, msgs[0].id, voiceBlob.blob, 'audio', user.id, 'farmer', voiceBlob.duration);
        }
      }

      if (videoFile && ticket?.id && user) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: msgs } = await (supabase as any)
          .from('expert_ticket_messages').select('id').eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true }).limit(1);
        if (msgs?.length) {
          const { uploadTicketMedia } = await import('@/hooks/useTicketMedia');
          await uploadTicketMedia(ticket.id, msgs[0].id, videoFile, 'video', user.id, 'farmer');
        }
      }

      setStep('done');
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) { navigate('/auth'); return null; }

  const stepIndex = ['form', 'office', 'technician'].indexOf(step);
  const stepLabels = ['समस्या', 'कार्यालय', 'प्राविधिक'];

  return (
    <>
      <Helmet>
        <title>कृषि प्राविधिकसँग सोध्नुहोस् - Kishan Sathi</title>
        <meta name="description" content="तपाईंको खेती सम्बन्धी समस्या कृषि प्राविधिकलाई पठाउनुहोस्।" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-center gap-3 h-14">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">👨‍🌾 कृषि प्राविधिकसँग सोध्नुहोस्</h1>
                <p className="text-[11px] text-muted-foreground truncate">तपाईंको खेती सम्बन्धी समस्या प्राविधिकलाई पठाउनुहोस्</p>
              </div>
            </div>
          </div>
        </div>

        <main className="pb-28 container mx-auto px-4 max-w-2xl pt-4">
          {/* Step Progress */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-1 mb-6">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      stepIndex === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' :
                      stepIndex > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{i + 1}</div>
                    <span className={`text-[10px] font-medium ${
                      stepIndex === i ? 'text-primary' : 'text-muted-foreground'
                    }`}>{label}</span>
                  </div>
                  {i < 2 && <div className={`w-10 h-0.5 mb-4 rounded-full transition-colors ${
                    stepIndex > i ? 'bg-primary/40' : 'bg-border'
                  }`} />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Problem Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Category Selection */}
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> समस्याको प्रकार
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            category === cat.value
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Crop & Problem */}
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-primary" /> बालीको नाम
                      </label>
                      <Input
                        placeholder="जस्तै: टमाटर, आलु, धान..."
                        value={cropName}
                        onChange={e => setCropName(e.target.value)}
                        className="rounded-xl h-12 text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">समस्याको शीर्षक *</label>
                      <Input
                        placeholder="जस्तै: पातमा दाग आयो"
                        value={problemTitle}
                        onChange={e => setProblemTitle(e.target.value)}
                        className="rounded-xl h-12 text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">समस्या विवरण *</label>
                      <Textarea
                        placeholder="समस्या कहिलेदेखि भएको हो? कति बालीमा छ?"
                        value={problemDescription}
                        onChange={e => setProblemDescription(e.target.value)}
                        rows={4}
                        className="rounded-xl text-base resize-none"
                        required
                      />
                      {interimTranscript && (
                        <p className="text-xs text-primary mt-1 animate-pulse">🎤 {interimTranscript}</p>
                      )}
                      {voiceSupported && (
                        <Button
                          variant={isListening ? 'destructive' : 'outline'}
                          size="sm"
                          className="mt-2 rounded-xl"
                          onClick={isListening ? stopListening : startListening}
                        >
                          {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                          {isListening ? 'बन्द गर्नुहोस्' : '🎤 बोल्नुहोस्'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Photo Upload */}
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      📷 फोटो अपलोड गर्नुहोस् ({imageFiles.length}/5)
                    </h2>

                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/40">
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={() => cameraInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Camera className="w-10 h-10 mx-auto text-primary/60 mb-2" />
                        <p className="text-sm font-medium text-foreground">बिरामी बालीको फोटो खिच्नुहोस्</p>
                        <p className="text-xs text-muted-foreground mt-1">ट्याप गरेर क्यामेरा खोल्नुहोस्</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl h-11"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={imageFiles.length >= 5}
                      >
                        <Camera className="w-4 h-4 mr-1.5" /> 📷 फोटो खिच्नुहोस्
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl h-11"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageFiles.length >= 5}
                      >
                        <Upload className="w-4 h-4 mr-1.5" /> 🖼 ग्यालरीबाट
                      </Button>
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageAdd} />

                    {/* Photo tips */}
                    <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                      {PHOTO_TIPS.map((tip, i) => (
                        <p key={i} className="text-xs text-muted-foreground">{tip}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Voice note */}
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground">🎤 भ्वाइस नोट (ऐच्छिक)</h2>
                    {voiceBlob ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground flex-1">{voiceBlob.duration}s रेकर्ड भयो</span>
                        <Button variant="ghost" size="sm" onClick={() => setVoiceBlob(null)}>हटाउनुहोस्</Button>
                      </div>
                    ) : showVoiceRecorder ? (
                      <AudioRecorder
                        maxDuration={60}
                        onRecorded={(blob, dur) => { setVoiceBlob({ blob, duration: dur }); setShowVoiceRecorder(false); }}
                        onCancel={() => setShowVoiceRecorder(false)}
                      />
                    ) : (
                      <Button variant="outline" className="rounded-xl h-11" onClick={() => setShowVoiceRecorder(true)}>
                        <Mic className="w-4 h-4 mr-1.5" /> बोलेरै समस्या बताउनुहोस्
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Video upload */}
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground">📹 छोटो भिडियो (ऐच्छिक)</h2>
                    {videoFile ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground flex-1">{videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                        <Button variant="ghost" size="sm" onClick={() => setVideoFile(null)}>हटाउनुहोस्</Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Button variant="outline" className="rounded-xl h-11" asChild>
                          <span><Video className="w-4 h-4 mr-1.5" /> भिडियो छान्नुहोस्</span>
                        </Button>
                        <input
                          type="file"
                          accept="video/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && f.size <= 10 * 1024 * 1024) setVideoFile(f);
                            else if (f) toast({ title: 'भिडियो १०MB भन्दा सानो हुनुपर्छ', variant: 'destructive' });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </CardContent>
                </Card>

                {/* Next button */}
                <Button
                  className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                  disabled={!problemTitle.trim() || !problemDescription.trim()}
                  onClick={() => setStep('office')}
                >
                  अर्को: कार्यालय छान्नुहोस् <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Office */}
            {step === 'office' && (
              <motion.div key="office" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      कृषि कार्यालय छान्नुहोस्
                    </h2>
                    {officesLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : offices && offices.length > 0 ? (
                      <div className="space-y-2">
                        {offices.map(office => (
                          <div
                            key={office.id}
                            onClick={() => { setSelectedOfficeId(office.id); setSelectedTechnicianId(null); }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              selectedOfficeId === office.id
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                : 'border-border/40 hover:border-primary/30 hover:bg-muted/30'
                            }`}
                          >
                            <p className="font-bold text-foreground">{office.name}</p>
                            <p className="text-sm text-muted-foreground">{office.district}</p>
                            {office.contact_phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                                <Phone className="w-3 h-3" /> {office.contact_phone}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" onClick={() => setStep('form')} className="flex-1 h-12 rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                          </Button>
                          <Button disabled={!selectedOfficeId} onClick={() => setStep('technician')} className="flex-1 h-12 rounded-xl">
                            अर्को <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-10">कुनै कार्यालय उपलब्ध छैन।</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Technician */}
            {step === 'technician' && (
              <motion.div key="technician" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="rounded-2xl border-border/40 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        कृषि प्राविधिक छान्नुहोस्
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        कार्यालय: <strong>{selectedOffice?.name}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        तपाईंले छान्नुभएको प्राविधिकलाई मात्र प्रश्न पठाइनेछ।
                      </p>
                    </div>

                    {techniciansLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : technicians && technicians.length > 0 ? (
                      <div className="space-y-2">
                        {technicians.map(tech => (
                          <div
                            key={tech.id}
                            onClick={() => setSelectedTechnicianId(tech.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              selectedTechnicianId === tech.id
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                : 'border-border/40 hover:border-primary/30 hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground">{tech.name}</p>
                                <p className="text-sm text-muted-foreground">{tech.role_title}</p>
                                {tech.specialization && (
                                  <p className="text-xs text-primary/80 mt-0.5">विशेषज्ञता: {tech.specialization}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5">
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
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" onClick={() => setStep('office')} className="flex-1 h-12 rounded-xl">
                            <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                          </Button>
                          <Button
                            disabled={!selectedTechnicianId || isSubmitting}
                            onClick={handleSubmit}
                            className="flex-1 h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
                          >
                            {isSubmitting ? (
                              <><Loader2 className="w-5 h-5 animate-spin mr-1.5" /> पठाउँदै...</>
                            ) : (
                              <><Send className="w-5 h-5 mr-1.5" /> 📤 समस्या पठाउनुहोस्</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <p className="text-muted-foreground">यस कार्यालयमा सक्रिय प्राविधिक छैन।</p>
                        <Button variant="outline" onClick={() => setStep('office')} className="rounded-xl">
                          <ArrowLeft className="w-4 h-4 mr-1" /> अर्को कार्यालय छान्नुहोस्
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="rounded-2xl border-2 border-primary/30 shadow-xl shadow-primary/10">
                  <CardContent className="py-12 px-6 text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    >
                      <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground">✅ समस्या पठाइयो!</h2>
                    <div className="bg-muted/40 rounded-2xl p-4 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        कार्यालय: <strong className="text-foreground">{selectedOffice?.name}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        प्राविधिक: <strong className="text-foreground">{selectedTechnician?.name}</strong>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      जवाफ आएपछि सूचना पाउनुहुनेछ।
                    </p>
                    <div className="flex flex-col gap-3 pt-4">
                      <Button onClick={() => navigate('/expert-questions')} className="h-12 rounded-xl text-base">
                        📋 मेरा प्रश्नहरू हेर्नुहोस्
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/farmer')} className="h-12 rounded-xl">
                        Dashboard मा जानुहोस्
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <FarmerBottomNav />
      </div>
    </>
  );
}
