import { motion } from "framer-motion";
import { Sun, CloudRain, Leaf, MapPin, Thermometer, Droplets } from "lucide-react";

const DailyAdviceSection = () => {
  return (
    <section className="py-12 sm:py-18">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-8">
            🌾 आजको खेती सुझाव
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Weather Widget */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-weather-bg))] flex items-center justify-center">
                  <Sun className="w-5 h-5 text-[hsl(var(--card-weather-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">आजको मौसम</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>काठमाडौं</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/60 rounded-xl p-3 text-center">
                  <Thermometer className="w-5 h-5 text-destructive mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">27°C</p>
                  <p className="text-xs text-muted-foreground">तापक्रम</p>
                </div>
                <div className="bg-background/60 rounded-xl p-3 text-center">
                  <Droplets className="w-5 h-5 text-[hsl(var(--card-weather-icon))] mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">30%</p>
                  <p className="text-xs text-muted-foreground">वर्षा सम्भावना</p>
                </div>
              </div>
            </motion.div>

            {/* Daily Advice Cards */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-diagnosis-bg))] flex items-center justify-center flex-shrink-0">
                  <CloudRain className="w-5 h-5 text-[hsl(var(--card-diagnosis-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">पानीको अनुमान</p>
                  <p className="text-xs text-muted-foreground mt-0.5">आज पानी पर्ने सम्भावना कम छ।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-market-bg))] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-[hsl(var(--card-market-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">आजको सुझाव</p>
                  <p className="text-xs text-muted-foreground mt-0.5">मकैमा रोग जाँच गर्न उपयुक्त दिन।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-ai-bg))] flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-[hsl(var(--card-ai-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">मौसम</p>
                  <p className="text-xs text-muted-foreground mt-0.5">आज मौसम सफा छ, सिँचाइ गर्न सकिन्छ।</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DailyAdviceSection;
