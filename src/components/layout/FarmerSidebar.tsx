import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Menu, X, Home, Camera, Sprout, Store, Bot, BookOpen, User,
  MessageSquare, GraduationCap, Stethoscope, LogOut, Settings,
  Shield,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserRole } from "@/hooks/useUserRole";
import type { MainTab } from "./FarmerBottomNav";

interface FarmerSidebarProps {
  onTabChange: (tab: MainTab) => void;
}

export function FarmerSidebar({ onTabChange }: FarmerSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();

  const mainLinks = [
    { icon: Home, label: "होम", action: () => onTabChange("home") },
    { icon: Camera, label: "रोग पहिचान", action: () => onTabChange("scan") },
    { icon: Sprout, label: "मेरो खेत", action: () => onTabChange("farm") },
    { icon: Store, label: "बजार भाउ", action: () => navigate("/market") },
    { icon: Bot, label: "AI Chat", action: () => onTabChange("ai") },
  ];

  const extraLinks = [
    { icon: BookOpen, label: "खेती गाइड", href: "/guides" },
    { icon: MessageSquare, label: "विज्ञ सोध्नुहोस्", href: "/ask-expert" },
    { icon: GraduationCap, label: "सिक्नुहोस्", href: "/learning" },
    { icon: Stethoscope, label: "उपचार", href: "/treatment-library" },
    { icon: Settings, label: "Settings", href: "/device/settings" },
    ...(isAdmin() ? [{ icon: Shield, label: "Admin", href: "/admin" }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Menu trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-card z-[61] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">किसान साथी</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                      {profile?.full_name || "Farmer"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Main links */}
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-3 space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    मुख्य
                  </p>
                  {mainLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        link.action();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <link.icon className="w-4.5 h-4.5 text-muted-foreground" />
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="px-3 mt-3 space-y-0.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                    थप
                  </p>
                  {extraLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        navigate(link.href);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <link.icon className="w-4.5 h-4.5 text-muted-foreground" />
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile + Logout at bottom */}
              <div className="p-3 border-t border-border/30 space-y-0.5">
                <button
                  onClick={() => {
                    onTabChange("profile");
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4.5 h-4.5 text-muted-foreground" />
                  👤 प्रोफाइल
                </button>
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  🚪 Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>के तपाईं एपबाट निस्कन चाहनुहुन्छ?</AlertDialogTitle>
            <AlertDialogDescription>
              तपाईं आफ्नो खाताबाट लगआउट हुनुहुनेछ।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
