import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card rounded-3xl p-8 sm:p-10 text-center border border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-5 shadow-md">
                <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {t('ctaTitle')} <span className="text-gradient">{t('ctaHighlight')}</span>
              </h2>
              
              <p className="text-base text-muted-foreground max-w-md mx-auto mb-8">
                {t('ctaDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/disease-detection">
                  <Button size="lg" className="group rounded-full px-7 py-6 text-base font-semibold w-full sm:w-auto shadow-md">
                    {t('ctaDiseaseBtn')}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link to="/expert-directory">
                  <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base font-medium w-full sm:w-auto border-2">
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    {t('ctaExpertBtn')}
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
