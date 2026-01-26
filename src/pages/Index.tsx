import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import QuickActionsGrid from "@/components/home/QuickActionsGrid";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Kisan Sathi | AI-Powered Farming Assistant</title>
        <meta
          name="description"
          content="Kisan Sathi helps Nepali farmers with AI-powered crop disease detection, weather advisories, market prices, and personalized farming recommendations."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <QuickActionsGrid />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
