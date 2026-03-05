import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.04] rounded-3xl p-10 sm:p-16 border border-border/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-52 h-52 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative">
              <div className="text-4xl mb-4">🌱</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                आज नै सुरु गर्नुहोस्
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-10">
                तपाईंको खेतीलाई स्मार्ट बनाउनुहोस् — AI सहायतासँग।
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/disease-detection">
                  <Button size="lg" className="group rounded-full px-10 py-7 text-base font-semibold shadow-lg w-full sm:w-auto">
                    📷 रोग पहिचान गर्नुहोस्
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/ask-expert">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-base font-medium w-full sm:w-auto border-2">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    विशेषज्ञसँग कुरा गर्नुहोस्
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
