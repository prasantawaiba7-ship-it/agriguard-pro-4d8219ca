import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Bot, Mic, Volume2, Leaf, CloudSun, Bug, Sprout, MessageCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { useLanguage } from "@/hooks/useLanguage";

const features = [
  {
    icon: Leaf,
    title: "Crop Disease Detection",
    description: "Upload photos of your crops to identify diseases and get treatment recommendations",
    color: "text-green-500",
  },
  {
    icon: CloudSun,
    title: "Weather Advisories",
    description: "Get localized weather forecasts and farming recommendations",
    color: "text-blue-500",
  },
  {
    icon: Bug,
    title: "Pest Management",
    description: "Identify pests and receive organic and chemical control suggestions",
    color: "text-orange-500",
  },
  {
    icon: Sprout,
    title: "Crop Recommendations",
    description: "Get AI-powered suggestions for crops based on your soil and climate",
    color: "text-emerald-500",
  },
];

const KrishiMitra = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>Krishi Mitra - AI Farming Assistant | CROPIC</title>
        <meta
          name="description"
          content="Krishi Mitra is your AI-powered farming assistant. Get instant help with crop diseases, weather advisories, pest management, and personalized farming recommendations."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            
            <div className="container mx-auto px-4 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto mb-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                  <Bot className="h-5 w-5" />
                  <span className="text-sm font-medium">AI-Powered Assistant</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Meet <span className="text-primary">Krishi Mitra</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground mb-8">
                  Your intelligent farming companion. Ask questions in your language, 
                  upload crop photos, and get instant expert advice powered by AI.
                </p>

                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span>Voice Input</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    <span>Audio Responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span>11 Languages</span>
                  </div>
                </div>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:bg-card/80 transition-colors"
                  >
                    <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </motion.div>

              {/* AI Assistant */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Krishi Mitra</h2>
                        <p className="text-sm text-white/80">Your AI Farming Assistant</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <AIAssistant />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* How to Use Section */}
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-bold text-foreground mb-4">How to Use Krishi Mitra</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Getting help is easy. Just type, speak, or upload a photo to get started.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {[
                  {
                    step: "1",
                    title: "Ask a Question",
                    description: "Type your farming question or use voice input in your preferred language",
                  },
                  {
                    step: "2",
                    title: "Upload Photos",
                    description: "Share photos of crop issues for AI-powered disease detection",
                  },
                  {
                    step: "3",
                    title: "Get Expert Advice",
                    description: "Receive instant, actionable recommendations from our AI",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default KrishiMitra;
