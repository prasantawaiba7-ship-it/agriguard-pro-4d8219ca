import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-3xl p-8 sm:p-10 lg:p-12 text-center border border-border/60 shadow-xl relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/8 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                आज नै <span className="text-gradient">सुरु गर्नुहोस्</span>
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                हजारौं नेपाली किसानहरू पहिले नै हाम्रो AI सेवाको फाइदा लिइरहेका छन्। 
                तपाईंको बालीको स्वास्थ्य जाँच गर्न आज नै सुरु गर्नुहोस्।
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6">
                <Link to="/disease-detection">
                  <Button size="lg" className="group rounded-full px-6 sm:px-8 py-6 text-base font-semibold w-full sm:w-auto shadow-lg">
                    रोग पहिचान गर्नुहोस्
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/expert-directory">
                  <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 py-6 text-base font-medium w-full sm:w-auto border-2">
                    <Phone className="w-5 h-5 mr-2 text-primary" />
                    विशेषज्ञसँग कुरा गर्नुहोस्
                  </Button>
                </Link>
              </div>

              {/* WhatsApp Support */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  सहयोगका लागि WhatsApp मा सम्पर्क गर्नुहोस्
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
