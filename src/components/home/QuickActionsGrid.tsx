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
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t('whatToDoToday')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {t('quickAccessInfo')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative rounded-2xl p-5 sm:p-6 ${action.cardBg} border border-border/30 hover:border-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer group min-h-[130px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${action.iconCircleBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                      {action.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
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
