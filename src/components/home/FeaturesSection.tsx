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

const features = [
  {
    icon: Camera,
    title: "फोटो अपलोड",
    description: "बालीको प्रभावित भागको फोटो खिच्नुहोस्।",
    color: "bg-red-500",
    lightBg: "bg-red-50 dark:bg-red-950/20",
  },
  {
    icon: Cpu,
    title: "AI विश्लेषण",
    description: "उन्नत AI ले रोग र कीरा पहिचान गर्छ।",
    color: "bg-primary",
    lightBg: "bg-primary/5",
  },
  {
    icon: FileText,
    title: "नेपाली रिपोर्ट",
    description: "विस्तृत रिपोर्ट र PDF डाउनलोड।",
    color: "bg-secondary",
    lightBg: "bg-secondary/5",
  },
  {
    icon: Clock,
    title: "तुरुन्त नतिजा",
    description: "केही सेकेन्डमा नतिजा प्राप्त।",
    color: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: MapPin,
    title: "स्थान आधारित",
    description: "तपाईंको क्षेत्र अनुसार सुझाव।",
    color: "bg-teal-500",
    lightBg: "bg-teal-50 dark:bg-teal-950/20",
  },
  {
    icon: Shield,
    title: "विशेषज्ञ सुझाव",
    description: "जैविक र रासायनिक उपचार विकल्प।",
    color: "bg-purple-500",
    lightBg: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    icon: Smartphone,
    title: "अफलाइन सपोर्ट",
    description: "इन्टरनेट नभएमा पनि काम गर्छ।",
    color: "bg-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    icon: Users,
    title: "विशेषज्ञ सम्पर्क",
    description: "कृषि प्राविधिकसँग सिधै सम्पर्क।",
    color: "bg-pink-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/20",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
      <div className="absolute inset-0 bg-mesh pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
            किसानका लागि{" "}
            <span className="text-gradient">सम्पूर्ण समाधान</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            आधुनिक AI र स्थानीय ज्ञानको संयोजन
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group"
            >
              <div className={`${feature.lightBg} rounded-2xl p-5 sm:p-6 h-full border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg`}>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}
                >
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
