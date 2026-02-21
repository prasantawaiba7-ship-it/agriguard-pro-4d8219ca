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
      iconColor: "text-primary",
      bgColor: "bg-primary/8",
      borderColor: "border-primary/12",
    },
    {
      icon: Store,
      label: t('krishiBazar'),
      sublabel: t('todayPrice'),
      href: "/market",
      iconColor: "text-primary",
      bgColor: "bg-primary/8",
      borderColor: "border-primary/12",
    },
    {
      icon: Cloud,
      label: t('weather'),
      sublabel: t('weatherInfo'),
      href: "/farmer?tab=weather",
      iconColor: "text-primary",
      bgColor: "bg-primary/8",
      borderColor: "border-primary/12",
    },
    {
      icon: Bot,
      label: t('aiHelper'),
      sublabel: t('agriKnowledge'),
      href: "/krishi-mitra",
      iconColor: "text-secondary",
      bgColor: "bg-secondary/8",
      borderColor: "border-secondary/12",
    },
    {
      icon: MapPin,
      label: t('myFieldLabel'),
      sublabel: t('fieldManagement'),
      href: "/fields",
      iconColor: "text-primary",
      bgColor: "bg-primary/8",
      borderColor: "border-primary/12",
    },
    {
      icon: BookOpen,
      label: t('farmingGuide'),
      sublabel: t('farmingKnowledge'),
      href: "/crop-guides",
      iconColor: "text-accent-foreground",
      bgColor: "bg-accent/12",
      borderColor: "border-accent/15",
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
                  className={`relative rounded-2xl p-5 sm:p-6 bg-card border ${action.borderColor} hover:border-primary/25 transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer group min-h-[120px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${action.iconColor}`} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                      {action.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">
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
