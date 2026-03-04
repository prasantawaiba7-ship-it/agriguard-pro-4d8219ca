import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-primary/[0.05] via-card to-accent/[0.03] rounded-3xl p-8 sm:p-12 border border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                आज नै सुरु गर्नुहोस्
              </h2>
              <p className="text-base text-muted-foreground max-w-md mx-auto mb-8">
                तपाईंको खेतीलाई स्मार्ट बनाउनुहोस् — AI सहायतासँग।
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/disease-detection">
                  <Button size="lg" className="group rounded-full px-7 py-6 text-base font-semibold shadow-md w-full sm:w-auto">
                    रोग पहिचान गर्नुहोस्
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/ask-expert">
                  <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base font-medium w-full sm:w-auto border-2">
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
