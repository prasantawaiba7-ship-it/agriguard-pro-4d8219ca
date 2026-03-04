import { motion } from "framer-motion";
import { Users, MapPin, Headphones } from "lucide-react";

const TrustSection = () => {
  const stats = [
    { icon: Users, value: "१०००+", label: "किसान प्रयोगकर्ता" },
    { icon: MapPin, value: "७७", label: "जिल्ला कभर" },
    { icon: Headphones, value: "२४/७", label: "AI कृषि सहायता" },
  ];

  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="text-center bg-card rounded-2xl border border-border/40 p-4 sm:p-6"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
