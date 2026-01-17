import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NepaliDiseaseDetector } from '@/components/ai/NepaliDiseaseDetector';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';

export default function DiseaseDetection() {
  return (
    <>
      <Helmet>
        <title>बाली रोग पहिचान | KrishiMitra Nepal</title>
        <meta 
          name="description" 
          content="AI-powered crop disease detection system in Nepali. Upload plant photos for instant disease diagnosis, treatment recommendations, and prevention tips." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              🌿 बाली रोग पहिचान प्रणाली
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              फोटो अपलोड गरेर तपाईंको बालीको रोग पहिचान गर्नुहोस्। 
              AI ले रोगको निदान, उपचार र रोकथामका उपायहरू सुझाव दिनेछ।
            </p>
          </div>

          <NepaliDiseaseDetector />

          {/* How to Use Section */}
          <div className="mt-12 p-6 bg-muted/50 rounded-2xl">
            <h2 className="text-xl font-semibold mb-4 text-center">
              📖 कसरी प्रयोग गर्ने?
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                { step: '१', title: 'बाली छान्नुहोस्', desc: 'ड्रपडाउनबाट बालीको प्रकार छान्नुहोस्' },
                { step: '२', title: 'फोटो लिनुहोस्', desc: 'प्रभावित पात/फलको नजिकबाट फोटो' },
                { step: '३', title: 'अपलोड गर्नुहोस्', desc: 'क्यामेरा वा गेलेरीबाट फोटो अपलोड' },
                { step: '४', title: 'विश्लेषण गर्नुहोस्', desc: '"विश्लेषण गर्नुहोस्" बटन थिच्नुहोस्' },
                { step: '५', title: 'रिपोर्ट डाउनलोड', desc: 'PDF रिपोर्ट डाउनलोड गर्नुहोस्' }
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
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
