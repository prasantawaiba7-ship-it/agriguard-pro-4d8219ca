import { motion } from "framer-motion";
import {
  Camera,
  Cpu,
  FileText,
  Clock,
  MapPin,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Camera, titleKey: 'featPhotoUpload', descKey: 'featPhotoUploadDesc', color: "text-primary", bg: "bg-primary/8" },
    { icon: Cpu, titleKey: 'featAIAnalysis', descKey: 'featAIAnalysisDesc', color: "text-secondary", bg: "bg-secondary/8" },
    { icon: FileText, titleKey: 'featReport', descKey: 'featReportDesc', color: "text-accent-foreground", bg: "bg-accent/10" },
    { icon: Clock, titleKey: 'featInstantResult', descKey: 'featInstantResultDesc', color: "text-primary", bg: "bg-primary/8" },
    { icon: MapPin, titleKey: 'featLocationBased', descKey: 'featLocationBasedDesc', color: "text-secondary", bg: "bg-secondary/8" },
    { icon: Shield, titleKey: 'featExpertAdvice', descKey: 'featExpertAdviceDesc', color: "text-primary", bg: "bg-primary/8" },
    { icon: Smartphone, titleKey: 'featOfflineSupport', descKey: 'featOfflineSupportDesc', color: "text-accent-foreground", bg: "bg-accent/10" },
    { icon: Users, titleKey: 'featExpertContact', descKey: 'featExpertContactDesc', color: "text-secondary", bg: "bg-secondary/8" },
  ];

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/20 pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {t('featuresSubheading')}{" "}
            <span className="text-gradient">{t('featuresHeading')}</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('featuresTagline')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-5 sm:p-6 h-full border border-border/40 hover:border-primary/20 transition-all duration-200 hover:shadow-md">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
