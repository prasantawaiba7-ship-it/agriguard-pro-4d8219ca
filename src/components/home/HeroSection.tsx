import { ArrowRight, Sparkles, Leaf } from "lucide-react";
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
    <section className="relative pt-24 sm:pt-32 pb-20 sm:pb-28 overflow-hidden">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-background to-accent/[0.04]" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.07] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/[0.06] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-secondary/[0.04] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.012]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Floating leaf decorations */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-[10%] hidden sm:block"
      >
        <Leaf className="w-8 h-8 text-primary/15" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-48 right-[12%] hidden sm:block"
      >
        <Leaf className="w-6 h-6 text-accent/20" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-24 left-[20%] hidden lg:block"
      >
        <Leaf className="w-5 h-5 text-secondary/15" />
      </motion.div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {displayName && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground font-medium mb-5"
            >
              🙏 नमस्ते, <span className="text-foreground font-semibold">{displayName}</span>
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-7"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">AI-Powered Agriculture</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] tracking-tight mb-6"
          >
            तपाईंको खेतीको{" "}
            <span className="text-gradient">स्मार्ट साथी</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-12"
          >
            बाली रोग पहिचान, मौसम जानकारी, बजार भाउ र AI कृषि सल्लाह — सबै एउटै ठाउँमा।
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/disease-detection">
              <Button size="lg" className="group rounded-full px-10 py-7 text-base font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                📷 रोग पहिचान गर्नुहोस्
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/krishi-mitra">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-10 py-7 text-base font-medium border-2 border-border hover:bg-primary/5 hover:border-primary/30 w-full sm:w-auto"
              >
                🤖 AI सँग सोध्नुहोस्
              </Button>
            </Link>
          </motion.div>

          {/* Quick stats under hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex items-center justify-center gap-6 sm:gap-10 mt-14 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>१०००+ किसान</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>७७ जिल्ला</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span>२४/७ AI सहायता</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
