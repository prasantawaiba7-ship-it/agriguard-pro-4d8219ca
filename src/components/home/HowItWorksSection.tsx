import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "१",
      icon: Camera,
      title: "फोटो खिच्नुहोस्",
      desc: "बालीको बिरामी भागको फोटो खिच्नुहोस्",
    },
    {
      number: "२",
      icon: Cpu,
      title: "AI विश्लेषण",
      desc: "AI ले सेकेन्डमा रोग पहिचान गर्छ",
    },
    {
      number: "३",
      icon: FileCheck,
      title: "रिपोर्ट पाउनुहोस्",
      desc: "उपचार सहित विस्तृत रिपोर्ट पाउनुहोस्",
    },
  ];

  return (
    <section className="py-12 sm:py-16 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            कसरी काम गर्छ?
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">तीन सजिलो चरणमा</p>
        </motion.div>

        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-4 sm:gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-6 h-full border border-border/40 hover:border-primary/20 transition-all duration-300 hover:shadow-md text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold shadow-md">
                  {step.number}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center mt-8"
        >
          <Link to="/disease-detection">
            <Button size="lg" className="group rounded-full px-8 py-6 text-base font-semibold shadow-md">
              <Camera className="w-5 h-5 mr-2" />
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
