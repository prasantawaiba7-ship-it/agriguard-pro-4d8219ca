import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AgriculturalOfficerDirectory } from '@/components/directory/AgriculturalOfficerDirectory';
import { FloatingVoiceButton } from '@/components/ai/FloatingVoiceButton';

export default function ExpertDirectory() {
  return (
    <>
      <Helmet>
        <title>कृषि प्राविधिक निर्देशिका | KrishiMitra Nepal</title>
        <meta 
          name="description" 
          content="Find and contact local agricultural officers and experts in Nepal. Get expert advice on crop diseases, pests, and farming practices from certified कृषि प्राविधिक." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-20 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              👨‍🌾 कृषि प्राविधिक निर्देशिका
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              आफ्नो नजिकको कृषि विशेषज्ञसँग सम्पर्क गर्नुहोस्। 
              रोग पहिचान, कीट नियन्त्रण, र उन्नत खेती प्रविधिको बारेमा विशेषज्ञ सल्लाह लिनुहोस्।
            </p>
          </div>

          <AgriculturalOfficerDirectory />

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-muted/50 rounded-2xl">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📞 सम्पर्क गर्नुअघि
              </h2>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• समस्याको फोटो तयार राख्नुहोस्</li>
                <li>• लक्षणहरू नोट गर्नुहोस्</li>
                <li>• बाली र क्षेत्रफल जानकारी राख्नुहोस्</li>
                <li>• कार्यालय समयमा फोन गर्नुहोस्</li>
              </ul>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🏢 नजिकको कृषि कार्यालय
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                यदि सूचीमा तपाईंको जिल्ला छैन भने, 
                नजिकको जिल्ला कृषि विकास कार्यालयमा सम्पर्क गर्न सक्नुहुन्छ।
              </p>
              <div className="p-3 bg-background rounded-lg text-sm">
                <p className="font-medium">राष्ट्रिय कृषि हेल्पलाइन:</p>
                <p className="text-primary font-semibold text-lg">📞 1618</p>
                <p className="text-muted-foreground text-xs mt-1">
                  (कार्यालय समय: बिहान १० - साँझ ५)
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <FloatingVoiceButton />
      </div>
    </>
  );
}
