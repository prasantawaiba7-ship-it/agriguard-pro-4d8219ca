import { Camera, Bot, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-background to-accent/[0.03]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.05] rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {displayName && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground font-medium mb-4"
            >
              🙏 नमस्ते, <span className="text-foreground font-semibold">{displayName}</span>
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Agriculture</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-5"
          >
            तपाईंको खेतीको{" "}
            <span className="text-gradient">स्मार्ट साथी</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10"
          >
            बाली रोग पहिचान, मौसम जानकारी, बजार भाउ र AI कृषि सल्लाह — सबै एउटै ठाउँमा।
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link to="/disease-detection">
              <Button size="lg" className="group rounded-full px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                📷 रोग पहिचान गर्नुहोस्
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/krishi-mitra">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-8 py-6 text-base font-medium border-2 border-border hover:bg-primary/5 hover:border-primary/30 w-full sm:w-auto"
              >
                <Bot className="w-5 h-5 mr-2 text-primary" />
                🤖 AI सँग सोध्नुहोस्
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
