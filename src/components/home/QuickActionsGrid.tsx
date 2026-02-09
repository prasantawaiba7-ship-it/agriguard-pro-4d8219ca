import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Cloud, Store, Bot, MapPin, BookOpen } from "lucide-react";

const quickActions = [
  {
    icon: Camera,
    label: "रोग पहिचान",
    sublabel: "फोटोबाट पहिचान",
    href: "/disease-detection",
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900/50",
    hoverColor: "hover:border-red-300 dark:hover:border-red-800",
  },
  {
    icon: Store,
    label: "कृषि बजार",
    sublabel: "आजको भाउ",
    href: "/market",
    color: "bg-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
    hoverColor: "hover:border-primary/40",
  },
  {
    icon: Cloud,
    label: "मौसम",
    sublabel: "मौसम जानकारी",
    href: "/farmer?tab=weather",
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    hoverColor: "hover:border-blue-300 dark:hover:border-blue-800",
  },
  {
    icon: Bot,
    label: "AI सहायक",
    sublabel: "कृषि ज्ञान",
    href: "/krishi-mitra",
    color: "bg-secondary",
    bgColor: "bg-secondary/5",
    borderColor: "border-secondary/20",
    hoverColor: "hover:border-secondary/40",
  },
  {
    icon: MapPin,
    label: "मेरो खेत",
    sublabel: "खेत व्यवस्थापन",
    href: "/fields",
    color: "bg-teal-500",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-900/50",
    hoverColor: "hover:border-teal-300 dark:hover:border-teal-800",
  },
  {
    icon: BookOpen,
    label: "खेती गाइड",
    sublabel: "खेती ज्ञान",
    href: "/crop-guides",
    color: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900/50",
    hoverColor: "hover:border-amber-300 dark:hover:border-amber-800",
  },
];

const QuickActionsGrid = () => {
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
            आज के गर्ने?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            छिटो पहुँचको लागि तलको कार्ड छान्नुहोस्
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative rounded-2xl p-4 sm:p-5 ${action.bgColor} border ${action.borderColor} ${action.hoverColor} transition-all duration-300 hover:shadow-lg active:scale-[0.98] cursor-pointer group`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${action.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform mx-auto`}
                  >
                    <action.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-base font-semibold text-foreground">
                      {action.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
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
