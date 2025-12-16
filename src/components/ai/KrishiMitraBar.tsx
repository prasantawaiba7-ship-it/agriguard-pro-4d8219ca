import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageCircle, Leaf, Bug, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { AIAssistant } from './AIAssistant';

interface KrishiMitraBarProps {
  onOpenAssistant?: () => void;
  initialAction?: 'chat' | 'recommend' | 'disease' | null;
}

export function KrishiMitraBar({ onOpenAssistant, initialAction = null }: KrishiMitraBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<'chat' | 'recommend' | 'disease' | null>(initialAction);
  const { t } = useLanguage();

  const handleAction = (action: 'chat' | 'recommend' | 'disease') => {
    setActiveAction(action);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setActiveAction(null);
  };

  return (
    <>
      {/* Floating Bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto"
          >
            <div className="bg-gradient-to-r from-primary via-primary to-accent rounded-2xl shadow-2xl p-3 backdrop-blur-sm border border-primary-foreground/10">
              <div className="flex items-center gap-3">
                {/* Logo & Name */}
                <div 
                  className="flex items-center gap-2 cursor-pointer" 
                  onClick={() => handleAction('chat')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <h3 className="font-bold text-primary-foreground text-sm">Krishi Mitra</h3>
                    <p className="text-xs text-primary-foreground/70">कृषि मित्र</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-8 bg-primary-foreground/20" />

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 gap-1.5"
                    onClick={() => handleAction('recommend')}
                  >
                    <Leaf className="w-4 h-4" />
                    <span className="hidden md:inline">Crop Tips</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 gap-1.5"
                    onClick={() => handleAction('disease')}
                  >
                    <Bug className="w-4 h-4" />
                    <span className="hidden md:inline">Scan Disease</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20 gap-1.5"
                    onClick={() => handleAction('chat')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Ask</span>
                  </Button>
                </div>

                {/* Expand Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full ml-auto"
                  onClick={() => handleAction('chat')}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 md:inset-auto md:bottom-4 md:right-4 md:w-[450px] md:h-[600px] md:rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="h-full bg-background flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-accent border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-foreground">Krishi Mitra</h3>
                    <p className="text-xs text-primary-foreground/70">{t('aiAssistant')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
                  onClick={handleClose}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* AI Assistant */}
              <div className="flex-1 overflow-hidden">
                <AIAssistant initialAction={activeAction} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
