import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Camera, MessageCircle, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

const LanguagePillToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center bg-muted rounded-full p-1 border border-border/50">
        <button
          onClick={() => setLanguage("ne")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
            language === "ne"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ने
        </button>
        <button
          onClick={() => setLanguage("en")}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
            language === "en"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          EN
        </button>
      </div>
      <span className="text-[10px] text-muted-foreground pl-1">
        {language === "ne" ? "भाषा बदल्नुस्" : "Change language"}
      </span>
    </div>
  );
};

const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const steps = [
    {
      icon: Leaf,
      iconBg: "bg-primary",
      emoji: "🙏",
      title: language === "ne" ? "किसान साथीमा स्वागत छ!" : "Welcome to Kisan Sathi!",
      subtitle: language === "ne"
        ? "तपाईंको डिजिटल खेती साथी"
        : "Your digital farming companion",
      description: language === "ne"
        ? "बाली रोग पत्ता लगाउनुहोस्, बजार भाउ हेर्नुहोस्, र विशेषज्ञसँग कुरा गर्नुहोस् — सबै एकै ठाउँमा।"
        : "Detect crop diseases, check market prices, and talk to experts — all in one place.",
    },
    {
      icon: Camera,
      iconBg: "bg-[hsl(var(--card-diagnosis-icon))]",
      emoji: "📸",
      title: language === "ne" ? "फोटो खिच्नुहोस्, जवाफ पाउनुहोस्" : "Snap a photo, get answers",
      subtitle: language === "ne"
        ? "बालीको फोटो → AI ले रोग पत्ता लगाउँछ"
        : "Crop photo → AI detects the disease",
      description: language === "ne"
        ? "बिरामी बालीको नजिकबाट फोटो खिच्नुहोस्। AI ले रोग पहिचान गरी उपचार बताउँछ।"
        : "Take a close-up photo of a sick crop. AI identifies the disease and suggests treatment.",
    },
    {
      icon: Phone,
      iconBg: "bg-blue-500",
      emoji: "👨‍🌾",
      title: language === "ne" ? "AI + विशेषज्ञ सँगै" : "AI + Experts together",
      subtitle: language === "ne"
        ? "AI सल्लाह + कृषि प्राविधिकको सहयोग"
        : "AI advice + support from agriculture technicians",
      description: language === "ne"
        ? "AI ले तुरुन्तै सल्लाह दिन्छ। जटिल समस्यामा कृषि विज्ञसँग टिकट खोल्नुहोस् वा कल गर्नुहोस्।"
        : "AI gives instant advice. For complex problems, open a ticket or call an agriculture expert.",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleQuickAction = (path: string) => {
    onComplete();
    navigate(path);
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <LanguagePillToggle />
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground font-medium px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
        >
          {language === "ne" ? "छोड्नुहोस् →" : "Skip →"}
        </button>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-2 py-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step}-${language}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center max-w-sm mx-auto"
          >
            {/* Icon */}
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ${currentStep.iconBg} flex items-center justify-center mb-6 shadow-lg`}>
              <currentStep.icon className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
            </div>

            {/* Emoji + Title */}
            <div className="text-4xl mb-3">{currentStep.emoji}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-2">
              {currentStep.title}
            </h1>
            <p className="text-base font-medium text-primary mb-3">
              {currentStep.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div className="px-6 pb-8 space-y-3">
        {step === steps.length - 1 ? (
          <>
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-md"
              onClick={() => handleQuickAction("/disease-detection")}
            >
              <Camera className="w-6 h-6 mr-3" />
              {language === "ne" ? "📸 रोग जाँच गर्नुहोस्" : "📸 Check Disease"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg font-semibold rounded-2xl border-2"
              onClick={() => handleQuickAction("/krishi-mitra")}
            >
              <MessageCircle className="w-6 h-6 mr-3 text-primary" />
              {language === "ne" ? "💬 प्रश्न सोध्नुहोस्" : "💬 Ask a Question"}
            </Button>
            <button
              onClick={handleNext}
              className="w-full text-center text-sm text-muted-foreground font-medium py-2"
            >
              {language === "ne" ? "पछि हेर्छु, गृहपृष्ठमा जानुहोस् →" : "Later, go to home →"}
            </button>
          </>
        ) : (
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-md group"
            onClick={handleNext}
          >
            {language === "ne" ? "अर्को" : "Next"}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WelcomeOnboarding;
