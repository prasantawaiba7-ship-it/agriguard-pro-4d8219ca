import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Cloud, Store, Bot, MapPin, BookOpen, Route, MessageCircleQuestion } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const QuickActionsGrid = () => {
  const { t } = useLanguage();

  const quickActions = [
    {
      icon: Camera,
      label: t('diseaseDetection'),
      sublabel: t('detectFromPhoto'),
      href: "/disease-detection",
      cardBg: "bg-[hsl(var(--card-diagnosis-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-diagnosis-icon))]",
    },
    {
      icon: Store,
      label: t('krishiBazar'),
      sublabel: t('todayPrice'),
      href: "/market",
      cardBg: "bg-[hsl(var(--card-market-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-market-icon))]",
    },
    {
      icon: Cloud,
      label: t('weather'),
      sublabel: t('weatherInfo'),
      href: "/farmer?tab=weather",
      cardBg: "bg-[hsl(var(--card-weather-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-weather-icon))]",
    },
    {
      icon: Bot,
      label: t('aiHelper'),
      sublabel: t('agriKnowledge'),
      href: "/krishi-mitra",
      cardBg: "bg-[hsl(var(--card-ai-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-ai-icon))]",
    },
    {
      icon: MapPin,
      label: t('myFieldLabel'),
      sublabel: t('fieldManagement'),
      href: "/fields",
      cardBg: "bg-[hsl(var(--card-field-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-field-icon))]",
    },
    {
      icon: BookOpen,
      label: t('farmingGuide'),
      sublabel: t('farmingKnowledge'),
      href: "/guides",
      cardBg: "bg-[hsl(var(--card-guide-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-guide-icon))]",
    },
    {
      icon: Route,
      label: "कृषि यात्रा",
      sublabel: "तपाईंको खेती कथा",
      href: "/action-film",
      cardBg: "bg-[hsl(var(--card-journey-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-journey-icon))]",
    },
    {
      icon: MessageCircleQuestion,
      label: "प्राविधिकसँग सोध्नुहोस्",
      sublabel: "विशेषज्ञ सल्लाह",
      href: "/ask-expert",
      cardBg: "bg-[hsl(var(--card-expert-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-expert-icon))]",
    },
  ];

  return (
    <section className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('whatToDoToday')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-md mx-auto">
            {t('quickAccessInfo')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative rounded-2xl p-5 sm:p-7 ${action.cardBg} border border-border/30 hover:border-border/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] cursor-pointer group min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${action.iconCircleBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                  >
                    <action.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-bold text-foreground leading-tight">
                      {action.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                      {action.sublabel}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActionsGrid;
