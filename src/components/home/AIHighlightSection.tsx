import { motion } from "framer-motion";
import { Bot, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AIHighlightSection = () => {
  return (
    <section className="py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.04] rounded-3xl border border-primary/15 p-6 sm:p-8 overflow-hidden">
            {/* Decorative blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">🤖 किसान साथी AI</h3>
                  <p className="text-sm text-muted-foreground">तपाईंको खेती सम्बन्धी प्रश्न सोध्नुहोस्</p>
                </div>
              </div>

              {/* Mock chat preview */}
              <div className="bg-background/60 rounded-xl p-4 mb-5 border border-border/40">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="w-4 h-4" />
                  <span className="italic">मेरो धानमा पहेंलो दाग देखिएको छ, के गर्ने?</span>
                </div>
              </div>

              <Link to="/krishi-mitra">
                <Button className="group rounded-full px-6 shadow-md">
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
