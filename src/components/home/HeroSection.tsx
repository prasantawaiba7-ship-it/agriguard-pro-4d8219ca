import { Button } from "@/components/ui/button";
import { Camera, Leaf, FileText, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] pt-20 pb-12 overflow-hidden hero-gradient">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-accent/15 rounded-full blur-2xl"
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">AI-Powered कृषि सहायक</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6"
          >
            तस्बिर खिचेर{" "}
            <span className="text-gradient">रोग चिन्नुहोस्</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            बालीको फोटो अपलोड गर्नुहोस्, AI ले रोग/कीराको पहिचान गरी 
            नेपालीमा विस्तृत रिपोर्ट र उपचार सुझाव दिनेछ।
          </motion.p>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link to="/disease-detection">
              <Button size="xl" className="group glow-pulse text-lg px-8 py-6 rounded-2xl">
                <Camera className="w-5 h-5 mr-2" />
                रोग पहिचान सुरु गर्नुहोस्
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/krishi-mitra">
              <Button size="xl" variant="outline" className="text-lg px-8 py-6 rounded-2xl glass-card border-primary/20 hover:border-primary/40">
                <Leaf className="w-5 h-5 mr-2 text-primary" />
                कृषि मित्रसँग कुरा गर्नुहोस्
              </Button>
            </Link>
          </motion.div>

          {/* Quick Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
          >
            {[
              { icon: Camera, label: "रोग पहिचान", sublabel: "AI विश्लेषण", href: "/disease-detection", color: "text-primary" },
              { icon: Leaf, label: "आजको सुझाव", sublabel: "कृषि सल्लाह", href: "/krishi-mitra", color: "text-secondary" },
              { icon: MapPin, label: "कृषि कार्यालय", sublabel: "नजिकको खोज्नुहोस्", href: "/expert-directory", color: "text-accent" },
              { icon: FileText, label: "रिपोर्ट", sublabel: "PDF डाउनलोड", href: "/farmer", color: "text-success" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              >
                <Link to={item.href}>
                  <div className="quick-action-btn glass-card">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-sm text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.sublabel}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              {[
                { value: "५०,०००+", label: "किसान सेवित" },
                { value: "९५%", label: "सटीकता दर" },
                { value: "तुरुन्त", label: "नतिजा" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-8 hidden lg:block"
      >
        <div className="glass-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">स्वस्थ बाली</div>
              <div className="text-xs text-success">कुनै समस्या छैन</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-40 right-8 hidden lg:block"
      >
        <div className="glass-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">AI विश्लेषण</div>
              <div className="text-xs text-primary">सक्रिय</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
