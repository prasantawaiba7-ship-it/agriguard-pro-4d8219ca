import { motion } from "framer-motion";
import {
  Camera,
  Cpu,
  MapPin,
  Clock,
  Shield,
  Users,
  Smartphone,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "फोटो अपलोड",
    titleEn: "Photo Upload",
    description: "बालीको प्रभावित भागको फोटो खिच्नुहोस् वा ग्यालरीबाट छान्नुहोस्।",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Cpu,
    title: "AI विश्लेषण",
    titleEn: "AI Analysis",
    description: "उन्नत AI ले रोग, कीरा र पोषक तत्व कमी पहिचान गर्छ।",
    gradient: "from-secondary to-primary",
  },
  {
    icon: FileText,
    title: "नेपाली रिपोर्ट",
    titleEn: "Nepali Report",
    description: "विस्तृत नेपाली भाषामा रिपोर्ट र PDF डाउनलोड।",
    gradient: "from-accent to-warning",
  },
  {
    icon: Clock,
    title: "तुरुन्त नतिजा",
    titleEn: "Instant Results",
    description: "केही सेकेन्डमा नतिजा प्राप्त गर्नुहोस्।",
    gradient: "from-success to-primary",
  },
  {
    icon: MapPin,
    title: "स्थान आधारित",
    titleEn: "Location Based",
    description: "तपाईंको क्षेत्रको जलवायु अनुसार सुझाव।",
    gradient: "from-primary to-accent",
  },
  {
    icon: Shield,
    title: "विशेषज्ञ सुझाव",
    titleEn: "Expert Advice",
    description: "जैविक र रासायनिक दुवै उपचार विकल्प।",
    gradient: "from-secondary to-success",
  },
  {
    icon: Smartphone,
    title: "अफलाइन काम",
    titleEn: "Works Offline",
    description: "इन्टरनेट नभएमा पनि फोटो खिच्न सकिन्छ।",
    gradient: "from-accent to-secondary",
  },
  {
    icon: Users,
    title: "विशेषज्ञ सम्पर्क",
    titleEn: "Expert Connect",
    description: "नजिकको कृषि प्राविधिकसँग सिधै सम्पर्क।",
    gradient: "from-success to-accent",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            किसानका लागि{" "}
            <span className="text-gradient">सम्पूर्ण समाधान</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            आधुनिक AI प्रविधि र स्थानीय ज्ञानको संयोजनले तपाईंको खेतीलाई सुरक्षित बनाउँछ।
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <div className="glass-card rounded-2xl p-6 h-full card-interactive border border-border/50 hover:border-primary/30">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {feature.titleEn}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
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
