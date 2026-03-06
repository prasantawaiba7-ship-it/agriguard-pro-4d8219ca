import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Leaf,
  Mic,
  MessageSquare,
  Camera,
  CloudSun,
  Sprout,
  FlaskConical,
  Store,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

const HomeScreen = () => {
  const { profile, user } = useAuth();
  const { t, language } = useLanguage();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  const chips = [
    {
      icon: Camera,
      label: language === "ne" ? "फोटो पठाउनुहोस्" : "Send photo",
      sub: language === "ne" ? "रोग पहिचान" : "Detect disease",
      href: "/disease-detection",
    },
    {
      icon: CloudSun,
      label: language === "ne" ? "आजको मौसम" : "Today's weather",
      sub: language === "ne" ? "के गर्ने?" : "What to do?",
      href: "/farmer?tab=weather",
    },
    {
      icon: Sprout,
      label: language === "ne" ? "कुन बाली?" : "Which crop?",
      sub: language === "ne" ? "मेरो जमिनको लागि" : "For my land",
      href: "/krishi-mitra",
    },
    {
      icon: FlaskConical,
      label: language === "ne" ? "मल सल्लाह" : "Fertilizer help",
      sub: language === "ne" ? "कति हाल्ने?" : "How much?",
      href: "/krishi-mitra",
    },
    {
      icon: Store,
      label: language === "ne" ? "बजार भाउ" : "Market price",
      sub: language === "ne" ? "आजको भाउ" : "Today's rate",
      href: "/market",
    },
  ];

  return (
    <section className="pt-20 sm:pt-24 pb-10 min-h-[85vh] flex flex-col">
      <div className="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 mb-3">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide">
              {language === "ne" ? "किसान साथी" : "Kisan Sathi"}
            </span>
          </div>

          {displayName ? (
            <p className="text-lg font-semibold text-foreground">
              🙏 {language === "ne" ? "नमस्ते" : "Namaste"},{" "}
              {displayName}!
            </p>
          ) : (
            <p className="text-lg font-semibold text-foreground">
              🙏 {language === "ne" ? "नमस्ते!" : "Namaste!"}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-1">
            {language === "ne"
              ? "खेतीको कुनै पनि प्रश्न सोध्नुहोस्"
              : "Ask me anything about farming"}
          </p>
        </motion.div>

        {/* ── Hero AI Entry ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <Link to="/krishi-mitra">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-6 sm:p-7 text-primary-foreground shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-5">
                {/* Large mic icon */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl sm:text-2xl font-bold leading-tight">
                    {language === "ne"
                      ? "AI सँग कुरा गर्नुहोस्"
                      : "Talk to AI assistant"}
                  </div>
                  <div className="text-sm opacity-90 mt-1 leading-snug">
                    {language === "ne"
                      ? "बोल्नुहोस् वा टाइप गर्नुहोस् — नेपालीमा"
                      : "Speak or type — in Nepali or English"}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Or type directly ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-3"
        >
          <Link to="/krishi-mitra">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 hover:border-primary/30 transition-colors cursor-pointer group">
              <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {language === "ne"
                  ? "आफ्नो प्रश्न यहाँ टाइप गर्नुहोस्…"
                  : "Type your farming question here…"}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* ── Suggestion chips ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          className="mt-6"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {language === "ne" ? "छिटो पहुँच" : "Quick access"}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <Link key={i} to={chip.href}>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer active:scale-[0.97]">
                  <chip.icon className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground leading-tight">
                      {chip.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-tight">
                      {chip.sub}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Spacer ── */}
        <div className="flex-1 min-h-6" />

        {/* ── Expert escalation (secondary) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mt-6 mb-4"
        >
          <Link to="/ask-expert">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 border border-border/30 px-4 py-3.5 hover:bg-muted transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground leading-tight">
                  {language === "ne"
                    ? "कृषि विज्ञसँग कुरा गर्नुहोस्"
                    : "Talk to a Krishi expert"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {language === "ne"
                    ? "गम्भीर समस्यामा विज्ञको सल्लाह लिनुहोस्"
                    : "For serious problems, get expert advice"}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HomeScreen;
