import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Store,
  CloudSun,
  Bot,
  MapPin,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const cards = [
  {
    icon: Camera,
    title: "रोग पहिचान",
    subtitle: "फोटोबाट पहिचान गर्नुहोस्",
    titleEn: "Disease Detection",
    href: "/disease-detection",
    cardBg: "bg-[hsl(var(--card-diagnosis-bg))]",
    iconBg: "bg-[hsl(var(--card-diagnosis-icon))]",
  },
  {
    icon: Store,
    title: "कृषि बजार",
    subtitle: "तपाईंको बजार भाउ",
    titleEn: "Market Prices",
    href: "/market",
    cardBg: "bg-[hsl(var(--card-market-bg))]",
    iconBg: "bg-[hsl(var(--card-market-icon))]",
  },
  {
    icon: CloudSun,
    title: "मौसम",
    subtitle: "आजको मौसम जानकारी",
    titleEn: "Weather",
    href: "/farmer?tab=weather",
    cardBg: "bg-[hsl(var(--card-weather-bg))]",
    iconBg: "bg-[hsl(var(--card-weather-icon))]",
  },
  {
    icon: Bot,
    title: "AI सहायक",
    subtitle: "खेतीको प्रश्न सोध्नुहोस्",
    titleEn: "AI Helper",
    href: "/krishi-mitra",
    cardBg: "bg-[hsl(var(--card-ai-bg))]",
    iconBg: "bg-[hsl(var(--card-ai-icon))]",
  },
  {
    icon: MapPin,
    title: "मेरो खेत",
    subtitle: "खेत व्यवस्थापन",
    titleEn: "My Farm",
    href: "/fields",
    cardBg: "bg-[hsl(var(--card-field-bg))]",
    iconBg: "bg-[hsl(var(--card-field-icon))]",
  },
  {
    icon: BookOpen,
    title: "खेती गाइड",
    subtitle: "लेख र खेती ज्ञान",
    titleEn: "Farming Guide",
    href: "/guides",
    cardBg: "bg-[hsl(var(--card-guide-bg))]",
    iconBg: "bg-[hsl(var(--card-guide-icon))]",
  },
];

const HomeScreen = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 max-w-xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {language === "ne" ? "आज के गर्ने?" : "What to do today?"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ne"
              ? "छिटो पहुँचको लागि तलको कार्ड छान्नुस्"
              : "Choose a card below for quick access"}
          </p>
        </motion.div>

        {/* 2×3 Card Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link to={card.href}>
                <div
                  className={`${card.cardBg} rounded-2xl p-5 border border-border/40 hover:border-border/60 hover:shadow-sm active:scale-[0.97] transition-all duration-200 cursor-pointer flex flex-col items-center text-center min-h-[130px] justify-center`}
                >
                  <div
                    className={`w-12 h-12 rounded-full ${card.iconBg} flex items-center justify-center mb-3`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                    {card.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                    {language === "ne" ? card.subtitle : card.titleEn}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Chat Bubble */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.4 }}
        onClick={() => navigate("/krishi-mitra")}
        className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        title={
          language === "ne"
            ? "AI सहायतासँग कुरा गर्नुहोस्"
            : "Chat with AI assistant"
        }
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </section>
  );
};

export default HomeScreen;
