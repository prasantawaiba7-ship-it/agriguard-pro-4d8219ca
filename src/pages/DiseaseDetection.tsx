import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';
import { OutbreakAlertsBanner } from '@/components/disease/OutbreakAlertsBanner';
import { DiseasePrediction } from '@/components/disease/DiseasePrediction';
import { useAuth } from '@/hooks/useAuth';

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
        <main className="container mx-auto px-4 pt-20 pb-24 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              🌿 बाली रोग र कीरा पहिचान प्रणाली
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              फोटो अपलोड गरेर तपाईंको बालीको रोग वा कीरा पहिचान गर्नुहोस्। 
              AI ले रोग/कीराको निदान, जैविक र रासायनिक उपचार, र रोकथामका उपायहरू सुझाव दिनेछ।
            </p>
          </div>

          {/* Outbreak Alerts Banner */}
          <OutbreakAlertsBanner />

          <NepaliDiseaseDetector />

          {/* Disease Prediction Section (for logged in users) */}
          {user && (
            <div className="mt-12">
              <DiseasePrediction />
            </div>
          )}

          {/* How to Use Section */}
          <div className="mt-12 p-6 bg-muted/50 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center">
              📖 कसरी प्रयोग गर्ने?
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { step: '१', title: 'बाली छान्नुहोस्', desc: 'ड्रपडाउनबाट बालीको प्रकार छान्नुहोस्' },
                { step: '२', title: 'फोटो लिनुहोस्', desc: 'प्रभावित पात/फल/कीराको नजिकबाट फोटो' },
                { step: '३', title: 'अपलोड गर्नुहोस्', desc: 'क्यामेरा वा गेलेरीबाट फोटो अपलोड' },
                { step: '४', title: 'विश्लेषण गर्नुहोस्', desc: 'AI ले रोग/कीरा पहिचान गर्नेछ' },
                { step: '५', title: 'उपचार पाउनुहोस्', desc: 'जैविक र रासायनिक उपचार विधि' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Pest identification tips */}
            <div className="mt-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                🐛 कीरा पहिचानको लागि सुझावहरू:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• कीराको नजिकबाट स्पष्ट फोटो लिनुहोस्</li>
                <li>• क्षति भएको पात वा फलको फोटो राख्नुहोस्</li>
                <li>• सकेसम्म दिनको उज्यालोमा फोटो खिच्नुहोस्</li>
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
