import { Leaf, ArrowRight, Store, Camera } from "lucide-react";
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
    <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-14 overflow-hidden">
      {/* Calm background mesh */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[250px] h-[250px] bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-5"
          >
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('heroTagline')}</span>
          </motion.div>

          {displayName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-base text-secondary font-medium mb-2"
            >
              🙏 {t('heroGreeting')}, {displayName}!
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4"
          >
            {t('heroTitle1')}{" "}
            <span className="text-gradient">{t('heroTitle2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
          >
            {t('heroDescription')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link to="/disease-detection">
              <Button size="lg" className="group rounded-full px-7 py-6 text-base font-semibold shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
                <Camera className="w-5 h-5 mr-2" />
                {t('detectDisease')}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link to="/market">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-7 py-6 text-base font-medium border-2 border-border hover:bg-primary/5 hover:border-primary/30 w-full sm:w-auto"
              >
                <Store className="w-5 h-5 mr-2 text-primary" />
                {t('viewMarketPrices')}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-10 flex flex-wrap justify-center gap-8 sm:gap-12"
          >
            {[
              { value: "10,000+", label: t('farmers') },
              { value: "77", label: t('districts') },
              { value: "24/7", label: t('aiSupport') },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
