import { motion } from "framer-motion";
import { Bot, ArrowRight, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AIHighlightSection = () => {
  return (
    <section className="py-12 sm:py-18">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.04] rounded-3xl border border-primary/15 p-7 sm:p-10 overflow-hidden">
            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/8 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">🤖 किसान साथी AI</h3>
                  <p className="text-sm text-muted-foreground">तपाईंको खेती सम्बन्धी प्रश्न सोध्नुहोस्</p>
                </div>
              </div>

              {/* Chat preview UI */}
              <div className="bg-background/70 rounded-2xl p-4 sm:p-5 mb-6 border border-border/40 space-y-3">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">
                    टमाटरको पातमा दाग आयो, के गर्ने?
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%] text-sm text-foreground">
                    यो Septoria leaf spot हुन सक्छ। प्रभावित पातहरू हटाउनुहोस् र Mancozeb स्प्रे गर्नुहोस्।
                  </div>
                </div>
                {/* Input preview */}
                <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border/50">
                  <Send className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground italic">तपाईंको प्रश्न लेख्नुहोस्...</span>
                </div>
              </div>

              <Link to="/krishi-mitra">
                <Button size="lg" className="group rounded-full px-8 py-6 text-base shadow-lg">
                  AI सँग कुरा गर्नुहोस्
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIHighlightSection;
