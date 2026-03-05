import { Home, Camera, Bot, Sprout, User } from "lucide-react";
import { motion } from "framer-motion";

export type MainTab = "home" | "scan" | "ai" | "farm" | "profile";

const navItems: { icon: typeof Home; label: string; tab: MainTab; isCenter?: boolean }[] = [
  { icon: Home, label: "होम", tab: "home" },
  { icon: Camera, label: "स्क्यान", tab: "scan" },
  { icon: Bot, label: "AI Chat", tab: "ai", isCenter: true },
  { icon: Sprout, label: "मेरो खेत", tab: "farm" },
  { icon: User, label: "प्रोफाइल", tab: "profile" },
];

interface FarmerBottomNavProps {
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
}

export function FarmerBottomNav({ activeTab = "home", onTabChange }: FarmerBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/40 safe-area-inset-bottom">
      <div className="flex items-end justify-around px-1 pt-1.5 pb-2">
        {navItems.map((item) => {
          const active = activeTab === item.tab;

          if (item.isCenter) {
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange?.(item.tab)}
                className="flex flex-col items-center -mt-4 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                    active ? "bg-primary" : "bg-primary/80"
                  }`}
                  style={{ boxShadow: "0 4px 20px hsl(150 67% 38% / 0.3)" }}
                >
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className={`text-[10px] font-semibold mt-1 ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              onClick={() => onTabChange?.(item.tab)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="farmerActiveTab"
                  className="w-5 h-0.5 rounded-full bg-primary mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
