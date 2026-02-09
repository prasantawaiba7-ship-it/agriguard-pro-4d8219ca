import { Leaf, ArrowRight, Store, Camera, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const { profile, user } = useAuth();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  return (
    <section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-32 w-[350px] h-[350px] bg-secondary/15 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">किसान साथी – तपाईँको खेतीको साथी</span>
          </motion.div>

          {displayName && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-base text-secondary font-medium mb-3"
            >
              🙏 नमस्ते, {displayName} जी!
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5"
          >
            तपाईँको खेतीको{" "}
            <span className="text-gradient">भरपर्दो साथी</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            रोग पहिचान, मौसम जानकारी, कृषि बजार भाउ र AI खेती सल्लाह — सबै एकै ठाउँमा, सजिलो र छिटो।
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
          >
            <Link to="/disease-detection">
              <Button size="lg" className="group rounded-full px-6 sm:px-8 py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                <Camera className="w-5 h-5 mr-2" />
                रोग पहिचान गर्नुहोस्
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/market">
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full px-6 sm:px-8 py-6 text-base sm:text-lg font-medium border-2 hover:bg-primary/5"
              >
                <Store className="w-5 h-5 mr-2 text-primary" />
                बजार भाउ हेर्नुहोस्
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {[
              { value: "10,000+", label: "किसान" },
              { value: "77", label: "जिल्ला" },
              { value: "24/7", label: "AI सहायता" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
