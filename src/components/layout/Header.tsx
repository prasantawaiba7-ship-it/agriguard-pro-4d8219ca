import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, LogIn, User, Shield, Camera, Bot, Store, Mountain, Home } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRole();

  const navLinks = [
    { href: "/", label: "गृह", icon: Home },
    { href: "/disease-detection", label: "रोग", icon: Camera },
    { href: "/fields", label: "मेरो खेत", icon: Mountain },
    { href: "/market", label: "कृषि बजार", icon: Store },
    { href: "/krishi-mitra", label: "AI", icon: Bot },
    ...(isAdmin() ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base sm:text-lg text-foreground">किसान साथी</span>
          </Link>

          {/* Desktop Navigation - Pill style */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 rounded-full p-1 border border-border/40">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative"
              >
                <motion.div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </motion.div>
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/farmer')}
                className="gap-2 rounded-full border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">{profile?.full_name || 'Dashboard'}</span>
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="rounded-full px-5"
              >
                <LogIn className="w-4 h-4 mr-2" />
                सुरु गर्नुहोस्
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-muted border border-border/50"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/98 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive(link.href)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive(link.href) 
                        ? "bg-primary-foreground/20" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            
            <div className="container mx-auto px-4 pb-4">
              <div className="pt-4 border-t border-border">
                {user ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={() => {
                      navigate('/farmer');
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    सुरु गर्नुहोस्
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
