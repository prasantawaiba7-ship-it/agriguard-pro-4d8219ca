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
  
  // Called when farmer clicks "विज्ञसँग सोध्नुहोस्" from AI result
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
    { step: '१', title: t('stepSelectCrop'), desc: t('stepCropType') },
    { step: '२', title: t('stepTakePhoto'), desc: t('stepDiseased') },
    { step: '३', title: t('stepUpload'), desc: t('stepUploadPhoto') },
    { step: '४', title: t('stepAnalysis'), desc: t('stepAICheck') },
    { step: '५', title: t('stepTreatment'), desc: t('stepGetAdvice') },
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-4">
              <span className="text-sm font-medium text-primary">🌿 {t('diseasePageTitle')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-foreground">
              {t('diseasePageTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t('diseasePageSubtitle')}
            </p>
          </div>

          <OutbreakAlertsBanner />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="ai" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2.5">{t('aiInstantCheck')}</TabsTrigger>
              <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2.5">{language === 'ne' ? 'रोग गाइड' : 'Disease Guide'}</TabsTrigger>
              <TabsTrigger value="expert" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2.5">{t('askExpert')}</TabsTrigger>
              <TabsTrigger value="prevention" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm py-2.5">{t('preventionTips') || 'रोकथाम'}</TabsTrigger>
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
              {/* Multi-channel contact hub */}
              <ContactExpertHub onOpenAppForm={() => {}} />

              {/* In-app form */}
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

          <div className="mt-12 p-5 sm:p-8 bg-card rounded-2xl border border-border/50 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-5 text-center text-foreground">
              {t('howToUse')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-5">
              {steps.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm sm:text-base border border-primary/15">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm mb-0.5 text-foreground">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 sm:mt-7 p-4 sm:p-5 bg-accent/8 rounded-xl border border-accent/15">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base text-foreground">
                💡 {t('photoTipsTitle')}
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1.5">
                <li>• {t('photoTip1')}</li>
                <li>• {t('photoTip2')}</li>
              </ul>
            </div>
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
