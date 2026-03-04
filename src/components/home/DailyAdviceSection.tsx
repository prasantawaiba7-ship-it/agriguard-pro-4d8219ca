import { motion } from "framer-motion";
import { Sun, CloudRain, Leaf } from "lucide-react";

const DailyAdviceSection = () => {
  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-6">
            🌾 आजको खेती सुझाव
          </h2>
          
          <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-weather-bg))] flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-[hsl(var(--card-weather-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">मौसम</p>
                  <p className="text-xs text-muted-foreground mt-0.5">आज मौसम सफा छ</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-diagnosis-bg))] flex items-center justify-center flex-shrink-0">
                  <CloudRain className="w-5 h-5 text-[hsl(var(--card-diagnosis-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">पानीको अनुमान</p>
                  <p className="text-xs text-muted-foreground mt-0.5">आज पानी पर्ने सम्भावना कम</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--card-market-bg))] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-[hsl(var(--card-market-icon))]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">सुझाव</p>
                  <p className="text-xs text-muted-foreground mt-0.5">मकैमा रोग जाँच गर्न उपयुक्त दिन</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DailyAdviceSection;
