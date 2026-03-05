import { useNavigate, useLocation } from "react-router-dom";
import { Home, Camera, Bot, Sprout, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "होम", path: "/farmer" },
  { icon: Camera, label: "स्क्यान", path: "/disease-detection" },
  { icon: Bot, label: "AI Chat", path: "/krishi-mitra", isCenter: true },
  { icon: Sprout, label: "मेरो खेत", path: "/fields" },
  { icon: User, label: "प्रोफाइल", path: "/farmer/profile" },
];

export function FarmerBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/40 safe-area-inset-bottom">
      <div className="flex items-end justify-around px-1 pt-1.5 pb-2">
        {navItems.map((item) => {
          const active = isActive(item.path);

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-4 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg"
                  style={{ boxShadow: "0 4px 20px hsl(150 67% 38% / 0.3)" }}
                >
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className="text-[10px] font-semibold text-primary mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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
