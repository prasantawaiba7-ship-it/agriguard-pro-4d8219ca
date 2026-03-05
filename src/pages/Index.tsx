import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SimpleHomeScreen from "@/components/home/SimpleHomeScreen";
import { PageTransition } from "@/components/layout/PageTransition";
import { Helmet } from "react-helmet-async";
import WelcomeOnboarding from "@/components/onboarding/WelcomeOnboarding";

const ONBOARDING_KEY = "kisan_sathi_onboarding_done";

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <WelcomeOnboarding onComplete={handleOnboardingComplete} />;
  }

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
            <SimpleHomeScreen />
          </main>
        </PageTransition>
        <Footer />
      </div>
    </>
  );
};

export default Index;
