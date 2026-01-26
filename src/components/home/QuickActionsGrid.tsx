import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Camera, Cloud, Leaf, Store } from "lucide-react";

const quickActions = [
  {
    icon: Camera,
    label: "रोग पहिचान",
    sublabel: "Disease Detection",
    href: "/disease-detection",
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/20 to-orange-500/10",
  },
  {
    icon: Cloud,
    label: "मौसम",
    sublabel: "Weather",
    href: "/farmer",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    icon: Leaf,
    label: "खेत/बाली",
    sublabel: "Field & Crops",
    href: "/activities",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-500/20 to-emerald-500/10",
  },
  {
    icon: Store,
    label: "बजार",
    sublabel: "Market",
    href: "/market",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/20 to-pink-500/10",
  },
];

const QuickActionsGrid = () => {
  return (
    <section className="py-6 sm:py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            के गर्नुहुन्छ आज?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What would you like to do today?
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link to={action.href}>
                <div
                  className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${action.bgGradient} border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer group`}
                >
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform mx-auto`}
                  >
                    <action.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  {/* Labels */}
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-foreground">
                      {action.label}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {action.sublabel}
                    </div>
                  </div>

                  {/* Decorative glow */}
                  <div
                    className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${action.gradient} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`}
                  />
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
