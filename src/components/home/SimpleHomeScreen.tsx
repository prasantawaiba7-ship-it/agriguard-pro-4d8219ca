import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageCircleQuestion, History, PhoneCall, Leaf, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const SimpleHomeScreen = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "";

  const actions = [
    {
      icon: MessageCircleQuestion,
      label: t("homeAskQuestion"),
      helper: t("homeAskQuestionHelper"),
      href: "/krishi-mitra",
      gradient: "from-primary to-primary/80",
    },
    {
      icon: History,
      label: t("homeViewAnswers"),
      helper: t("homeViewAnswersHelper"),
      href: "/my-questions",
      gradient: "from-secondary to-secondary/80",
    },
    {
      icon: PhoneCall,
      label: t("homeCallExpert"),
      helper: t("homeCallExpertHelper"),
      href: "/ask-expert",
      gradient: "from-accent to-accent/80",
    },
  ];

  return (
    <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 min-h-[80vh] flex flex-col justify-center">
      <div className="container mx-auto px-4 max-w-md">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 mb-4">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{t("heroTagline")}</span>
          </div>

          {displayName && (
            <p className="text-lg text-foreground font-semibold mb-1">
              🙏 {t("heroGreeting")}, {displayName}!
            </p>
          )}

          <p className="text-base text-muted-foreground">
            {t("homeGreetingLine")}
          </p>
        </motion.div>

        {/* 3 Big Buttons */}
        <div className="flex flex-col gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
            >
              <Link to={action.href}>
                <div className={`relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r ${action.gradient} text-primary-foreground shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer group`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <action.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-bold leading-tight">
                        {action.label}
                      </div>
                      <div className="text-sm opacity-90 mt-0.5 leading-snug">
                        {action.helper}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 flex items-start gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/40"
        >
          <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("homeSimpleTip")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SimpleHomeScreen;
