import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { Camera, BookOpen, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';

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

  const tabConfig = [
    { value: 'ai', label: language === 'ne' ? 'रोग पहिचान' : 'Detect', icon: Camera },
    { value: 'guide', label: language === 'ne' ? 'रोग गाइड' : 'Guide', icon: BookOpen },
    { value: 'expert', label: language === 'ne' ? 'विज्ञ' : 'Expert', icon: MessageCircleQuestion },
    { value: 'prevention', label: language === 'ne' ? 'रोकथाम' : 'Prevent', icon: ShieldCheck },
  ];

  return (
    <>
      <Helmet>
        <title>{language === 'ne' ? 'बाली रोग पहिचान' : 'Crop Disease Detection'} | Kisan Sathi</title>
        <meta name="description" content={language === 'ne' ? 'बालीको फोटो अपलोड गर्नुहोस् र AI बाट रोग पहिचान पाउनुहोस्।' : 'Upload crop photo and get AI disease detection.'} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Compact Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="px-4 py-3 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  {language === 'ne' ? '📷 बाली रोग पहिचान' : '📷 Crop Disease Detection'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {language === 'ne' ? 'फोटो अपलोड गर्नुहोस् · AI रोग पहिचान' : 'Upload photo · AI detection'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
          <OutbreakAlertsBanner />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted/60 rounded-2xl">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-xs sm:text-sm py-2.5 gap-1.5 font-medium transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <NepaliDiseaseDetector onAskExpert={handleAskExpert} />
              {user && <DiseasePrediction />}
            </TabsContent>

            <TabsContent value="guide" className="mt-4">
              <DiseaseGuideTab />
            </TabsContent>

            <TabsContent value="expert" className="mt-4 space-y-4">
              <ContactExpertHub onOpenAppForm={() => {}} />
              <AskExpertForm 
                prefill={expertPrefill} 
                onSubmitted={() => setExpertPrefill(undefined)} 
              />
              {user && <ExpertCaseHistory />}
            </TabsContent>

            <TabsContent value="prevention" className="mt-4">
              <PreventionTipsSection />
            </TabsContent>
          </Tabs>

          {/* Photo Tips - only show on AI tab */}
          {activeTab === 'ai' && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-card rounded-2xl border border-border/50"
            >
              <h3 className="font-semibold text-sm mb-3 text-foreground">
                💡 {language === 'ne' ? 'राम्रो फोटो कसरी खिच्ने?' : 'How to take a good photo?'}
              </h3>
              <div className="space-y-2">
                {[
                  language === 'ne' ? '✔ राम्रो प्रकाशमा फोटो खिच्नुहोस्' : '✔ Take photo in good light',
                  language === 'ne' ? '✔ पात नजिकबाट फोटो लिनुहोस्' : '✔ Take close-up of the leaf',
                  language === 'ne' ? '✔ रोगग्रस्त भागमा फोकस गर्नुहोस्' : '✔ Focus on the affected area',
                ].map((tip, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{tip}</p>
                ))}
              </div>
            </motion.div>
          )}
        </main>

        <FarmerBottomNav />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
