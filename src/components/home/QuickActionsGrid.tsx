import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Cloud, Store, Bot, MapPin, BookOpen } from "lucide-react";
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
      iconColor: "text-white",
    },
    {
      icon: Store,
      label: t('krishiBazar'),
      sublabel: t('todayPrice'),
      href: "/market",
      cardBg: "bg-[hsl(var(--card-market-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-market-icon))]",
      iconColor: "text-white",
    },
    {
      icon: Cloud,
      label: t('weather'),
      sublabel: t('weatherInfo'),
      href: "/farmer?tab=weather",
      cardBg: "bg-[hsl(var(--card-weather-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-weather-icon))]",
      iconColor: "text-white",
    },
    {
      icon: Bot,
      label: t('aiHelper'),
      sublabel: t('agriKnowledge'),
      href: "/krishi-mitra",
      cardBg: "bg-[hsl(var(--card-ai-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-ai-icon))]",
      iconColor: "text-white",
    },
    {
      icon: MapPin,
      label: t('myFieldLabel'),
      sublabel: t('fieldManagement'),
      href: "/fields",
      cardBg: "bg-[hsl(var(--card-field-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-field-icon))]",
      iconColor: "text-white",
    },
    {
      icon: BookOpen,
      label: t('farmingGuide'),
      sublabel: t('farmingKnowledge'),
      href: "/guides",
      cardBg: "bg-[hsl(var(--card-guide-bg))]",
      iconCircleBg: "bg-[hsl(var(--card-guide-icon))]",
      iconColor: "text-white",
    },
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t('whatToDoToday')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('quickAccessInfo')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative rounded-2xl p-5 sm:p-6 ${action.cardBg} border border-border/40 hover:border-border/60 transition-all duration-200 hover:shadow-sm active:scale-[0.98] cursor-pointer group min-h-[120px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${action.iconCircleBg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${action.iconColor}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-body sm:text-body-lg font-medium text-foreground leading-tight">
                      {action.label}
                    </div>
                    <div className="text-helper text-muted-foreground mt-1 line-clamp-1">
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
