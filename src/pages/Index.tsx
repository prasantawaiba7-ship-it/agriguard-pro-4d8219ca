import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import QuickActionsGrid from "@/components/home/QuickActionsGrid";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { MyMarketShortcut } from "@/components/home/MyMarketShortcut";
import { PageTransition } from "@/components/layout/PageTransition";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>किसान साथी | नेपाली किसानहरूको लागि AI-संचालित खेती सहायक</title>
        <meta
          name="description"
          content="किसान साथीले नेपाली किसानहरूलाई AI रोग पहिचान, मौसम सल्लाह, कृषि बजार भाउ, र व्यक्तिगत खेती सिफारिसहरू प्रदान गर्दछ।"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <PageTransition>
          <main>
            <HeroSection />
            <QuickActionsGrid />
            
            <section className="py-4 sm:py-6">
              <div className="container mx-auto px-4 max-w-xl">
                <MyMarketShortcut />
              </div>
            </section>
            
            <FeaturesSection />
            <HowItWorksSection />
            <CTASection />
          </main>
        </PageTransition>
        <Footer />
      </div>
    </>
  );
};

export default Index;
