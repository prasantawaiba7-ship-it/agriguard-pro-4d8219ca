import { motion } from "framer-motion";
import { Camera, Cpu, FileCheck, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const HowItWorksSection = () => {
  const { t, language } = useLanguage();

  const steps = [
    {
      number: language === 'ne' ? "१" : "1",
      icon: Camera,
      titleKey: 'howStep1Title',
      descKey: 'howStep1Desc',
      tipKey: 'howStep1Tip',
    },
    {
      number: language === 'ne' ? "२" : "2",
      icon: Cpu,
      titleKey: 'howStep2Title',
      descKey: 'howStep2Desc',
      tipKey: 'howStep2Tip',
    },
    {
      number: language === 'ne' ? "३" : "3",
      icon: FileCheck,
      titleKey: 'howStep3Title',
      descKey: 'howStep3Desc',
      tipKey: 'howStep3Tip',
    },
  ];

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {t('howItWorksTitle')} <span className="text-gradient">{t('howItWorksHighlight')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('howItWorksSubtitle')}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {steps.map((step, index) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-14 left-full w-6 items-center justify-center z-10 -ml-3">
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
                
                <div className="bg-card rounded-2xl p-6 h-full border border-border/50 hover:border-primary/25 transition-all duration-200 hover:shadow-md relative">
                  <div className="absolute -top-3 -left-1 w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                    {step.number}
                  </div>
                  
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 mt-2">
                    <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                  
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-medium">
                    {t(step.tipKey)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center mt-10"
        >
          <Link to="/disease-detection">
            <Button size="lg" className="group rounded-full px-8 py-6 text-base font-semibold shadow-md">
              <Camera className="w-5 h-5 mr-2" />
              {t('tryNow')}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
