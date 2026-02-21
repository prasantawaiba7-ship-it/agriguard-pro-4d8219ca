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
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-900/50",
      hoverColor: "hover:border-red-300 dark:hover:border-red-800",
    },
    {
      icon: Store,
      label: t('krishiBazar'),
      sublabel: t('todayPrice'),
      href: "/market",
      color: "bg-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      hoverColor: "hover:border-primary/40",
    },
    {
      icon: Cloud,
      label: t('weather'),
      sublabel: t('weatherInfo'),
      href: "/farmer?tab=weather",
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-900/50",
      hoverColor: "hover:border-blue-300 dark:hover:border-blue-800",
    },
    {
      icon: Bot,
      label: t('aiHelper'),
      sublabel: t('agriKnowledge'),
      href: "/krishi-mitra",
      color: "bg-secondary",
      bgColor: "bg-secondary/5",
      borderColor: "border-secondary/20",
      hoverColor: "hover:border-secondary/40",
    },
    {
      icon: MapPin,
      label: t('myFieldLabel'),
      sublabel: t('fieldManagement'),
      href: "/fields",
      color: "bg-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      borderColor: "border-teal-200 dark:border-teal-900/50",
      hoverColor: "hover:border-teal-300 dark:hover:border-teal-800",
    },
    {
      icon: BookOpen,
      label: t('farmingGuide'),
      sublabel: t('farmingKnowledge'),
      href: "/crop-guides",
      color: "bg-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-900/50",
      hoverColor: "hover:border-amber-300 dark:hover:border-amber-800",
    },
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative rounded-2xl p-5 sm:p-6 ${action.bgColor} border ${action.borderColor} ${action.hoverColor} transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:scale-[0.97] cursor-pointer group min-h-[120px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${action.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
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
