import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 sm:py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-8 shadow-xl"
              >
                <Leaf className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                आज नै <span className="text-gradient">सुरु गर्नुहोस्</span>
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                हजारौं नेपाली किसानहरू पहिले नै हाम्रो AI सेवाको फाइदा लिइरहेका छन्। 
                तपाईंको बालीको स्वास्थ्य जाँच गर्न आज नै सुरु गर्नुहोस्।
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link to="/disease-detection">
                  <Button size="xl" className="group text-lg px-8 py-6 rounded-2xl w-full sm:w-auto">
                    रोग पहिचान गर्नुहोस्
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/expert-directory">
                  <Button size="xl" variant="outline" className="text-lg px-8 py-6 rounded-2xl w-full sm:w-auto glass-card border-primary/20">
                    <Phone className="w-5 h-5 mr-2 text-primary" />
                    विशेषज्ञसँग कुरा गर्नुहोस्
                  </Button>
                </Link>
              </div>

              {/* WhatsApp Support */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
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
