import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAgOffices, useTechnicians, useCreateExpertTicket, uploadExpertImage, type Technician } from '@/hooks/useExpertTickets';
import { ArrowLeft, ArrowRight, Building2, UserCheck, Send, ImagePlus, X, Loader2, Phone, Mail, CheckCircle2 } from 'lucide-react';

type Step = 'office' | 'technician' | 'form' | 'done';

export default function AskExpertPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('office');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [cropName, setCropName] = useState('');
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: offices, isLoading: officesLoading } = useAgOffices();
  const { data: technicians, isLoading: techLoading } = useTechnicians(selectedOfficeId);
  const createTicket = useCreateExpertTicket();

  const selectedOffice = offices?.find(o => o.id === selectedOfficeId);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - imageFiles.length;
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
    if (!selectedOfficeId || !selectedTechnician || !problemTitle.trim() || !problemDescription.trim()) return;
    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadExpertImage(file);
        imageUrls.push(url);
      }
      await createTicket.mutateAsync({
        officeId: selectedOfficeId,
        technicianId: selectedTechnician.id,
        cropName: cropName || 'N/A',
        problemTitle: problemTitle.trim(),
        problemDescription: problemDescription.trim(),
        imageUrls,
      });
      setStep('done');
    } catch {
      // error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>कृषि प्राविधिकसँग सोध्नुहोस् - Kishan Sathi</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-28 container mx-auto px-4 max-w-2xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
          </Button>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
            🌾 कृषि प्राविधिकसँग सोध्नुहोस्
          </h1>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            {(['office', 'technician', 'form'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-primary text-primary-foreground' :
                  (['office', 'technician', 'form'].indexOf(step) > i || step === 'done')
                    ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{i + 1}</div>
                {i < 2 && <div className="w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Office */}
            {step === 'office' && (
              <motion.div key="office" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      कृषि कार्यालय छान्नुहोस्
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {officesLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : offices && offices.length > 0 ? (
                      <div className="space-y-3">
                        {offices.map(office => (
                          <div
                            key={office.id}
                            onClick={() => { setSelectedOfficeId(office.id); setSelectedTechnician(null); }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedOfficeId === office.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40'
                            }`}
                          >
                            <p className="font-semibold text-foreground">{office.name}</p>
                            <p className="text-sm text-muted-foreground">{office.district}</p>
                            {office.contact_phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" /> {office.contact_phone}
                              </p>
                            )}
                          </div>
                        ))}
                        <Button
                          className="w-full mt-4"
                          disabled={!selectedOfficeId}
                          onClick={() => setStep('technician')}
                        >
                          अर्को <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">कुनै कार्यालय उपलब्ध छैन।</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Select Technician */}
            {step === 'technician' && (
              <motion.div key="technician" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCheck className="w-5 h-5 text-primary" />
                      कृषि प्राविधिक छान्नुहोस्
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedOffice?.name}</p>
                  </CardHeader>
                  <CardContent>
                    {techLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : technicians && technicians.length > 0 ? (
                      <div className="space-y-3">
                        {technicians.map(tech => (
                          <div
                            key={tech.id}
                            onClick={() => setSelectedTechnician(tech)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedTechnician?.id === tech.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-foreground">{tech.name}</p>
                                <p className="text-sm text-muted-foreground">{tech.role_title}</p>
                                {tech.specialization && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                    {tech.specialization}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {tech.phone && <Phone className="w-4 h-4 text-muted-foreground" />}
                                {tech.email && <Mail className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" onClick={() => setStep('office')} className="flex-1">
                            <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                          </Button>
                          <Button disabled={!selectedTechnician} onClick={() => setStep('form')} className="flex-1">
                            अर्को <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">यस कार्यालयमा कुनै प्राविधिक छैन।</p>
                        <Button variant="outline" onClick={() => setStep('office')} className="mt-4">
                          <ArrowLeft className="w-4 h-4 mr-1" /> अर्को कार्यालय छान्नुहोस्
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Question Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📝 समस्या विवरण</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      पठाउने: <strong>{selectedTechnician?.name}</strong> ({selectedOffice?.name})
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">बालीको नाम</label>
                      <Input
                        placeholder="जस्तै: धान, गहुँ, तरकारी..."
                        value={cropName}
                        onChange={e => setCropName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">समस्याको शीर्षक *</label>
                      <Input
                        placeholder="जस्तै: पातमा पहेंलो दाग"
                        value={problemTitle}
                        onChange={e => setProblemTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">विस्तृत विवरण *</label>
                      <Textarea
                        placeholder="समस्या कहिलेदेखि भएको हो, कति बालीमा छ, के उपचार प्रयोग गर्नुभयो..."
                        value={problemDescription}
                        onChange={e => setProblemDescription(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>

                    {/* Image upload */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        फोटो जोड्नुहोस् (अधिकतम ३)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {imagePreviews.map((preview, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {imageFiles.length < 3 && (
                          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                            <ImagePlus className="w-6 h-6 text-muted-foreground" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageAdd} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setStep('technician')} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-1" /> पछाडि
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!problemTitle.trim() || !problemDescription.trim() || isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-1" /> पठाउँदै...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-1" /> पठाउनुहोस्</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="text-center">
                  <CardContent className="py-12 space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                    <h2 className="text-xl font-bold text-foreground">प्रश्न पठाइयो!</h2>
                    <p className="text-muted-foreground">
                      तपाईंको प्रश्न <strong>{selectedTechnician?.name}</strong> ({selectedOffice?.name}) लाई पठाइएको छ।
                      जवाफ आएपछि सूचना पाउनुहुनेछ।
                    </p>
                    <div className="flex flex-col gap-2 pt-4">
                      <Button onClick={() => navigate('/expert-questions')}>
                        मेरा प्रश्नहरू हेर्नुहोस्
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/farmer')}>
                        Dashboard मा जानुहोस्
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </>
  );
}
