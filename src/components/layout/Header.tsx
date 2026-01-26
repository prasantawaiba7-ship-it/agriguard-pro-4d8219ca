import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, LogIn, User, Shield, Camera, Cloud, Store, Mountain, Crown } from "lucide-react";
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

  // Simplified nav links for mobile-first design
  const navLinks = [
    { href: "/disease-detection", label: "रोग पहिचान", icon: Camera },
    { href: "/fields", label: "मेरो खेत", icon: Mountain },
    { href: "/market", label: "बजार", icon: Store },
    { href: "/krishi-mitra", label: "AI सहायक", icon: Cloud },
    { href: "/subscription", label: "सदस्यता", icon: Crown },
    // Show Admin only to admin users
    ...(isAdmin() ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - HUNCHA branding */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl text-foreground leading-tight">Kisan Sathi</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin() && (
                  <Shield className="w-4 h-4 text-primary" aria-label="Admin" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/farmer')}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name || 'Dashboard'}
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/auth')}>सुरु गर्नुहोस्</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition-colors flex items-center gap-3 ${
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.icon && <link.icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                {user ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      navigate('/farmer');
                      setIsMenuOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        navigate('/auth');
                        setIsMenuOpen(false);
                      }}
                    >
                      सुरु गर्नुहोस्
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
