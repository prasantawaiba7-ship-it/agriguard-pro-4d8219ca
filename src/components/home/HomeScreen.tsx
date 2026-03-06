import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  AlertTriangle,
  CloudSun,
  Sprout,
  FlaskConical,
  Store,
  Mic,
  Leaf,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const suggestions = [
  {
    icon: Camera,
    label: "Send photo",
    labelNe: "फोटो पठाउनुस्",
    sub: "Check crop disease",
    href: "/disease-detection",
  },
  {
    icon: AlertTriangle,
    label: "What's wrong?",
    labelNe: "समस्या बर्णन गर्नुस्",
    sub: "Describe your problem",
    href: "/krishi-mitra",
  },
  {
    icon: CloudSun,
    label: "Today's advice",
    labelNe: "आज के गर्ने?",
    sub: "Weather-based tips",
    href: "/farmer?tab=weather",
  },
  {
    icon: Sprout,
    label: "Which crop?",
    labelNe: "कुन बाली?",
    sub: "Crop planning help",
    href: "/krishi-mitra",
  },
  {
    icon: FlaskConical,
    label: "Fertilizer help",
    labelNe: "मल सल्लाह",
    sub: "How much to use",
    href: "/krishi-mitra",
  },
  {
    icon: Store,
    label: "Market price",
    labelNe: "बजार भाउ",
    sub: "Today's rates",
    href: "/market",
  },
];

const HomeScreen = () => {
  const { profile, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  return (
    <section className="pt-20 sm:pt-24 pb-28 min-h-[85vh] flex flex-col">
      <div className="container mx-auto px-4 max-w-lg flex-1 flex flex-col">
        {/* ── Badge + Greeting ── */}
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

          <p className="text-lg font-semibold text-foreground">
            🙏 {language === "ne" ? "नमस्ते" : "Namaste"}
            {displayName ? `, ${displayName}!` : "!"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ne"
              ? "तपाईंलाई खेतीको के सहयोग चाहियो?"
              : "What farming help do you need?"}
          </p>
        </motion.div>

        {/* ── Suggestion Grid 2×3 ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {suggestions.map((s, i) => (
            <Link key={i} to={s.href}>
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97] transition-all duration-200 cursor-pointer text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {language === "ne" ? s.labelNe : s.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {language === "ne" ? s.labelNe : s.sub}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1 min-h-4" />
      </div>

      {/* ── Fixed Bottom Input / Voice Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border/40 px-4 py-3"
      >
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {/* Text input area (navigates to chat) */}
          <button
            onClick={() => navigate("/krishi-mitra")}
            className="flex-1 flex items-center gap-3 rounded-full border border-border/60 bg-card px-4 py-3 hover:border-primary/30 transition-colors text-left"
          >
            <span className="text-sm text-muted-foreground truncate">
              {language === "ne"
                ? "तपाईंको प्रश्न यहाँ लेख्नुहोस्…"
                : "Type your question here…"}
            </span>
          </button>

          {/* Voice button */}
          <button
            onClick={() => navigate("/krishi-mitra")}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 active:scale-95 transition-all shadow-md"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-1.5 max-w-lg mx-auto">
          {language === "ne"
            ? "AI सँग कुरा गर्नुहोस् — नेपाली या English मा"
            : "Talk to AI — in Nepali or English"}
        </p>
      </motion.div>
    </section>
  );
};

export default HomeScreen;
