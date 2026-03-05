import { motion } from "framer-motion";
import { Users, MapPin, Headphones, Award } from "lucide-react";

const TrustSection = () => {
  const stats = [
    { icon: Users, value: "१०००+", label: "किसान प्रयोगकर्ता", color: "text-primary" },
    { icon: MapPin, value: "७७", label: "जिल्ला कभर", color: "text-secondary" },
    { icon: Award, value: "५०+", label: "कृषि विशेषज्ञ", color: "text-accent-foreground" },
    { icon: Headphones, value: "२४/७", label: "AI कृषि सहायता", color: "text-primary" },
  ];

  return (
    <section className="py-12 sm:py-18">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            किसानहरूको विश्वास
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">नेपालभर किसानहरूले भरोसा गर्ने प्लेटफर्म</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="text-center bg-card rounded-2xl border border-border/40 p-6 sm:p-8 hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
