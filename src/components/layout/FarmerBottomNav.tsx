import { Home, Camera, Bot, Sprout, User } from "lucide-react";
import { motion } from "framer-motion";

export type MainTab = "home" | "scan" | "ai" | "farm" | "profile";

const navItems: { icon: typeof Home; label: string; tab: MainTab }[] = [
  { icon: Home, label: "गृह", tab: "home" },
  { icon: Camera, label: "स्क्यान", tab: "scan" },
  { icon: Bot, label: "AI", tab: "ai" },
  { icon: Sprout, label: "मेरो खेत", tab: "farm" },
  { icon: User, label: "प्रोफाइल", tab: "profile" },
];

interface FarmerBottomNavProps {
  activeTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
}

export function FarmerBottomNav({ activeTab = "home", onTabChange }: FarmerBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 safe-area-inset-bottom">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => onTabChange?.(item.tab)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[60px] py-2 relative transition-colors active:bg-muted/40"
            >
              {/* Active indicator bar */}
              {active && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <item.icon
                className={`w-[22px] h-[22px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span
                className={`text-[11px] leading-tight transition-colors ${
                  active
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
