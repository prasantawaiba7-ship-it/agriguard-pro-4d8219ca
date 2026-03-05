import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { OutbreakAlertsBanner } from '@/components/disease/OutbreakAlertsBanner';
import { DiseasePrediction } from '@/components/disease/DiseasePrediction';
import { AskExpertForm } from '@/components/diagnosis/AskExpertForm';
import { ExpertCaseHistory } from '@/components/diagnosis/ExpertCaseHistory';
import { ContactExpertHub } from '@/components/diagnosis/ContactExpertHub';
import { PreventionTipsSection } from '@/components/disease/PreventionTipsSection';
import { DiseaseGuideTab } from '@/components/disease/DiseaseGuideTab';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, BookOpen, MessageCircleQuestion, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface AiPrefill {
  imageDataUrl?: string;
  cropName?: string;
  cropId?: number;
  aiDisease?: string;
  aiConfidence?: number;
  aiRecommendation?: string;
}

export default function DiseaseDetection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('ai');
  const [expertPrefill, setExpertPrefill] = useState<AiPrefill | undefined>();
  
  const handleAskExpert = useCallback((prefill: {
    imageDataUrl?: string;
    cropName?: string;
    aiDisease?: string;
    aiConfidence?: number;
    aiRecommendation?: string;
  }) => {
    setExpertPrefill(prefill);
    setActiveTab('expert');
  }, []);

  const steps = [
    { step: '१', title: t('stepSelectCrop'), desc: t('stepCropType'), icon: '🌾' },
    { step: '२', title: t('stepTakePhoto'), desc: t('stepDiseased'), icon: '📷' },
    { step: '३', title: t('stepUpload'), desc: t('stepUploadPhoto'), icon: '📤' },
    { step: '४', title: t('stepAnalysis'), desc: t('stepAICheck'), icon: '🤖' },
    { step: '५', title: t('stepTreatment'), desc: t('stepGetAdvice'), icon: '💊' },
  ];

  const tabConfig = [
    { value: 'ai', label: t('aiInstantCheck'), icon: Camera },
    { value: 'guide', label: language === 'ne' ? 'रोग गाइड' : 'Disease Guide', icon: BookOpen },
    { value: 'expert', label: t('askExpert'), icon: MessageCircleQuestion },
    { value: 'prevention', label: t('preventionTips') || 'रोकथाम', icon: ShieldCheck },
  ];

  return (
    <>
      <Helmet>
        <title>{t('diseasePageTitle')} | Kisan Sathi</title>
        <meta name="description" content={t('diseasePageSubtitle')} />
      </Helmet>

      <div className="min-h-screen bg-background overflow-y-auto">
        <Header />
        
        <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-32 max-w-4xl">
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">🌿 AI-Powered Detection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground leading-tight">
              {t('diseasePageTitle')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t('diseasePageSubtitle')}
            </p>
          </motion.div>

          <OutbreakAlertsBanner />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1.5 p-1.5 bg-muted/50 rounded-2xl">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-sm py-3 gap-2 font-medium transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="ai" className="space-y-6">
              <NepaliDiseaseDetector onAskExpert={handleAskExpert} />
              {user && (
                <div className="mt-6">
                  <DiseasePrediction />
                </div>
              )}
            </TabsContent>

            <TabsContent value="guide" className="space-y-6">
              <DiseaseGuideTab />
            </TabsContent>

            <TabsContent value="expert" className="space-y-6">
              <ContactExpertHub onOpenAppForm={() => {}} />
              <AskExpertForm 
                prefill={expertPrefill} 
                onSubmitted={() => setExpertPrefill(undefined)} 
              />
              {user && (
                <div className="mt-6">
                  <ExpertCaseHistory />
                </div>
              )}
            </TabsContent>

            <TabsContent value="prevention" className="space-y-6">
              <PreventionTipsSection />
            </TabsContent>
          </Tabs>

          {/* How to Use Section */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 p-6 sm:p-10 bg-card rounded-3xl border border-border/50 shadow-sm"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-8 text-center text-foreground">
              {t('howToUse')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-5 sm:gap-6">
              {steps.map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/15">
                    {item.step}
                  </div>
                  <div className="text-xl mb-1">{item.icon}</div>
                  <h3 className="font-bold text-xs sm:text-sm mb-0.5 text-foreground">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-5 sm:p-6 bg-accent/8 rounded-2xl border border-accent/15">
              <h3 className="font-bold mb-2.5 flex items-center gap-2 text-sm sm:text-base text-foreground">
                💡 {t('photoTipsTitle')}
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                <li>• {t('photoTip1')}</li>
                <li>• {t('photoTip2')}</li>
              </ul>
            </div>
          </motion.div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
