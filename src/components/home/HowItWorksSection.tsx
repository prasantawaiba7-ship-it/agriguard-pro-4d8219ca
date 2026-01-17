import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "१",
    icon: Camera,
    title: "फोटो खिच्नुहोस्",
    description: "बालीको प्रभावित पात, डाँठ वा फलको नजिकबाट स्पष्ट फोटो खिच्नुहोस्।",
    tip: "राम्रो प्रकाशमा नजिकबाट खिच्नुहोस्",
  },
  {
    number: "२",
    icon: Cpu,
    title: "AI विश्लेषण",
    description: "हाम्रो AI प्रणालीले तपाईंको फोटो विश्लेषण गर्छ र समस्या पहिचान गर्छ।",
    tip: "केही सेकेन्डमा नतिजा",
  },
  {
    number: "३",
    icon: FileCheck,
    title: "रिपोर्ट प्राप्त गर्नुहोस्",
    description: "विस्तृत नेपाली रिपोर्ट, उपचार सुझाव र PDF डाउनलोड गर्नुहोस्।",
    tip: "WhatsApp मा पनि Share गर्नुहोस्",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            कसरी <span className="text-gradient">प्रयोग गर्ने?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            ३ सजिलो चरणमा तपाईंको बालीको समस्या पत्ता लगाउनुहोस्
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 z-0" style={{ width: 'calc(100% - 2rem)' }}>
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  </div>
                )}
                
                <div className="glass-card rounded-3xl p-6 sm:p-8 h-full relative z-10 card-interactive border border-border/50">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Tip Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm">
                    💡 {step.tip}
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
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Link to="/disease-detection">
            <Button size="xl" className="group text-lg px-8 py-6 rounded-2xl">
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
