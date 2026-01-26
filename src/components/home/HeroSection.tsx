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
      {/* Warm mesh background */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -left-32 w-[350px] h-[350px] bg-secondary/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* App badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">HUNCHA – किसान साथी</span>
          </motion.div>

          {/* Welcome message */}
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

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5"
          >
            तपाईंको खेतीको{" "}
            <span className="text-gradient">विश्वसनीय साथी</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            रोग पहिचान, मौसम जानकारी, बजार भाउ र AI खेती सल्लाह — सबै एकै ठाउँमा, सजिलो र छिटो।
          </motion.p>

          {/* CTA Buttons */}
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
                बजार हेर्नुहोस्
              </Button>
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {[
              { value: "१०,०००+", label: "किसानहरू" },
              { value: "७७", label: "जिल्लाहरू" },
              { value: "२४/७", label: "AI सहायता" },
            ].map((stat, index) => (
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
