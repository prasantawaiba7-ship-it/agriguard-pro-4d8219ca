import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "१",
    icon: Camera,
    title: "फोटो खिच्नुहोस्",
    description: "बालीको प्रभावित पात वा फलको स्पष्ट फोटो खिच्नुहोस्।",
    tip: "💡 राम्रो प्रकाशमा नजिकबाट खिच्नुहोस्",
    color: "bg-red-500",
  },
  {
    number: "२",
    icon: Cpu,
    title: "AI विश्लेषण",
    description: "हाम्रो AI प्रणालीले समस्या पहिचान गर्छ।",
    tip: "⚡ केही सेकेन्डमा नतिजा",
    color: "bg-primary",
  },
  {
    number: "३",
    icon: FileCheck,
    title: "रिपोर्ट पाउनुहोस्",
    description: "विस्तृत उपचार सुझाव र PDF डाउनलोड गर्नुहोस्।",
    tip: "📄 WhatsApp मा Share गर्नुहोस्",
    color: "bg-secondary",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            कसरी <span className="text-gradient">प्रयोग गर्ने?</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            ३ सजिलो चरणमा तपाईंको बालीको समस्या पत्ता लगाउनुहोस्
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative"
              >
                {/* Connector Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-14 left-full w-6 items-center justify-center z-10 -ml-3">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                
                <div className="bg-card rounded-2xl p-6 sm:p-7 h-full border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg relative">
                  {/* Step Number Badge */}
                  <div className={`absolute -top-3 -left-1 w-10 h-10 rounded-xl ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5 mt-3">
                    <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Tip Badge */}
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs sm:text-sm font-medium">
                    {step.tip}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 sm:mt-14"
        >
          <Link to="/disease-detection">
            <Button size="lg" className="group rounded-full px-8 py-6 text-base sm:text-lg font-semibold shadow-lg">
              <Camera className="w-5 h-5 mr-2" />
              अहिले प्रयास गर्नुहोस्
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
