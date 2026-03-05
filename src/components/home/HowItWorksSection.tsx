import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "१",
      emoji: "📷",
      icon: Camera,
      title: "फोटो खिच्नुहोस्",
      desc: "बालीको बिरामी भागको फोटो खिच्नुहोस्",
      color: "bg-[hsl(var(--card-diagnosis-icon))]",
    },
    {
      number: "२",
      emoji: "🤖",
      icon: Cpu,
      title: "AI विश्लेषण",
      desc: "AI ले सेकेन्डमा रोग पहिचान गर्छ",
      color: "bg-primary",
    },
    {
      number: "३",
      emoji: "📄",
      icon: FileCheck,
      title: "रिपोर्ट पाउनुहोस्",
      desc: "उपचार सहित विस्तृत रिपोर्ट पाउनुहोस्",
      color: "bg-[hsl(var(--card-market-icon))]",
    },
  ];

  return (
    <section className="py-14 sm:py-20 relative">
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            कसरी काम गर्छ?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">तीन सजिलो चरणमा</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.12 }}
              className="relative"
            >
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(50%+40px)] w-[calc(100%-40px)] h-[2px] bg-border/50 z-0" />
              )}
              
              <div className="bg-card rounded-2xl p-7 h-full border border-border/40 hover:border-primary/20 transition-all duration-300 hover:shadow-lg text-center relative z-10">
                <div className={`w-12 h-12 rounded-full ${step.color} text-white flex items-center justify-center mx-auto mb-5 text-xl font-bold shadow-md`}>
                  {step.number}
                </div>
                <div className="text-3xl mb-3">{step.emoji}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link to="/disease-detection">
            <Button size="lg" className="group rounded-full px-10 py-7 text-base font-semibold shadow-lg">
              अहिले प्रयोग गर्नुहोस्
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
