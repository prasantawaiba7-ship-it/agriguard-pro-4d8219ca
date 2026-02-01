import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { OutbreakAlertsBanner } from '@/components/disease/OutbreakAlertsBanner';
import { DiseasePrediction } from '@/components/disease/DiseasePrediction';
import { DiagnosisCaseSubmit } from '@/components/diagnosis/DiagnosisCaseSubmit';
import { MyDiagnosisCases } from '@/components/diagnosis/MyDiagnosisCases';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DiseaseDetection() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>बाली रोग र कीरा पहिचान | KrishiMitra Nepal</title>
        <meta 
          name="description" 
          content="AI-powered crop disease and pest identification system in Nepali. Upload plant photos for instant diagnosis of diseases, pests, insects, treatment recommendations, and prevention tips." 
        />
      </Helmet>

      <div className="min-h-screen bg-background overflow-y-auto">
        <Header />
        
        {/* pt-20 for header, pb-20 for UserBar */}
        <main className="container mx-auto px-4 pt-20 pb-32 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              🌿 रोग र कीरा पहिचान
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              फोटो अपलोड गर्नुहोस्, AI ले रोग/कीरा पत्ता लगाई उपचार सुझाव दिनेछ।
            </p>
          </div>

          {/* Outbreak Alerts Banner */}
          <OutbreakAlertsBanner />

          {/* Main Tabs: AI Detection vs Expert Review */}
          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">🤖 AI तुरुन्त जाँच</TabsTrigger>
              <TabsTrigger value="expert">👨‍🌾 विज्ञलाई सोध्नुहोस्</TabsTrigger>
            </TabsList>

            {/* AI Detection Tab */}
            <TabsContent value="ai" className="space-y-6">
              <NepaliDiseaseDetector />
              
              {/* Disease Prediction Section (for logged in users) */}
              {user && (
                <div className="mt-6">
                  <DiseasePrediction />
                </div>
              )}
            </TabsContent>

            {/* Expert Review Tab */}
            <TabsContent value="expert" className="space-y-6">
              <DiagnosisCaseSubmit />
              
              {user && (
                <div className="mt-6">
                  <MyDiagnosisCases />
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* How to Use Section - Simplified Steps */}
          <div className="mt-12 p-4 sm:p-6 bg-muted/50 rounded-2xl">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              📖 कसरी प्रयोग गर्ने?
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
              {[
                { step: '१', title: 'बाली छान्ने', desc: 'बाली प्रकार' },
                { step: '२', title: 'फोटो खिच्ने', desc: 'रोगी पात/फल' },
                { step: '३', title: 'अपलोड गर्ने', desc: 'फोटो हाल्ने' },
                { step: '४', title: 'विश्लेषण', desc: 'AI जाँच' },
                { step: '५', title: 'उपचार', desc: 'सुझाव पाउने' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm mb-0.5">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Pest identification tips - Simplified */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-warning/10 rounded-xl border border-warning/20">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                🐛 राम्रो फोटोको लागि:
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• नजिकबाट स्पष्ट फोटो खिच्नुहोस्</li>
                <li>• दिनको उज्यालोमा खिच्नुहोस्</li>
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
