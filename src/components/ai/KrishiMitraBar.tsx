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
      {/* Floating Pill Bar */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:w-auto"
          >
            <div 
              className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 rounded-full p-2 sm:p-2.5 border border-primary-foreground/10"
              style={{ boxShadow: '0 4px 20px hsl(153 55% 27% / 0.2), 0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo */}
                <button 
                  className="flex items-center gap-2 pl-1"
                  onClick={() => handleAction('chat')}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center glow-pulse">
                    <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="hidden sm:block">
                    <h3 className="font-bold text-primary-foreground text-sm leading-tight">Krishi Mitra</h3>
                    <p className="text-[10px] text-primary-foreground/60">कृषि मित्र</p>
                  </div>
                </button>

                <div className="hidden sm:block w-px h-7 bg-primary-foreground/15" />

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/15 gap-1 h-8 px-2.5 rounded-full text-xs"
                    onClick={() => handleAction('recommend')}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Tips</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/15 gap-1 h-8 px-2.5 rounded-full text-xs"
                    onClick={() => handleAction('disease')}
                  >
                    <Bug className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Scan</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/15 gap-1 h-8 px-2.5 rounded-full text-xs"
                    onClick={() => handleAction('chat')}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-xs">Ask</span>
                  </Button>
                </div>

                <Button
                  size="icon"
                  className="rounded-full w-8 h-8 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 ml-auto"
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
            className="fixed inset-0 z-50 md:inset-auto md:bottom-4 md:right-4 md:w-[440px] md:h-[580px] md:rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="h-full bg-background flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/85 border-b border-primary-foreground/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary-foreground text-sm">Krishi Mitra</h3>
                    <p className="text-[10px] text-primary-foreground/60">{t('aiAssistant')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/15 rounded-full w-8 h-8"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
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
