import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { OutbreakAlertsBanner } from '@/components/disease/OutbreakAlertsBanner';
import { DiseasePrediction } from '@/components/disease/DiseasePrediction';
import { DiagnosisCaseSubmit } from '@/components/diagnosis/DiagnosisCaseSubmit';
import { MyDiagnosisCases } from '@/components/diagnosis/MyDiagnosisCases';
import { PreventionTipsSection } from '@/components/disease/PreventionTipsSection';
import { DiseaseGuideTab } from '@/components/disease/DiseaseGuideTab';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DiseaseDetection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
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
        
        <main className="container mx-auto px-4 pt-20 pb-32 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              🌿 {t('diseasePageTitle')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              {t('diseasePageSubtitle')}
            </p>
          </div>

          <OutbreakAlertsBanner />

          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="ai">{t('aiInstantCheck')}</TabsTrigger>
              <TabsTrigger value="guide">{language === 'ne' ? 'रोग गाइड' : 'Disease Guide'}</TabsTrigger>
              <TabsTrigger value="expert">{t('askExpert')}</TabsTrigger>
              <TabsTrigger value="prevention">{t('preventionTips') || 'रोकथाम'}</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6">
              <NepaliDiseaseDetector />
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
              <DiagnosisCaseSubmit />
              {user && (
                <div className="mt-6">
                  <MyDiagnosisCases />
                </div>
              )}
            </TabsContent>

            <TabsContent value="prevention" className="space-y-6">
              <PreventionTipsSection />
            </TabsContent>
          </Tabs>

          <div className="mt-12 p-4 sm:p-6 bg-muted/50 rounded-2xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {t('howToUse')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              {steps.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm mb-0.5">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-warning/10 rounded-xl border border-warning/20">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                {t('photoTipsTitle')}
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>{t('photoTip1')}</li>
                <li>{t('photoTip2')}</li>
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
