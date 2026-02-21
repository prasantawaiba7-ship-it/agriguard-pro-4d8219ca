import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Home, Mountain, Sparkles, Bell, User } from "lucide-react";
import { motion } from "framer-motion";

export function UserBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  if (!user || location.pathname !== "/") return null;

  const navItems = [
    { icon: Home, label: t('homeNav') || 'Home', path: '/' },
    { icon: Mountain, label: t('myField') || 'Fields', path: '/fields' },
    { icon: Sparkles, label: 'Krishi Mitra', path: '/krishi-mitra', isCenter: true },
    { icon: Bell, label: t('alerts') || 'Alerts', path: '/farmer?tab=weather' },
    { icon: User, label: t('profileLabel') || 'Profile', path: '/farmer/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-inset-bottom">
      <div className="flex items-end justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-3 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 4px 16px hsl(153 55% 27% / 0.25)' }}
                >
                  <item.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <span className="text-[10px] font-semibold text-primary mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeTab"
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
