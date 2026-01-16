import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { SUBSCRIPTION_PLANS } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => Promise<void>;
  queriesUsed: number;
  queriesLimit: number;
}

export function SubscriptionModal({ 
  isOpen, 
  onClose, 
  onSubscribe,
  queriesUsed,
  queriesLimit
}: SubscriptionModalProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan);
    try {
      await onSubscribe(plan);
    } finally {
      setLoading(null);
    }
  };

  const features = [
    language === 'ne' ? 'असीमित AI कृषि सल्लाह' : 'Unlimited AI farming advice',
    language === 'ne' ? 'रोग पहिचान र उपचार' : 'Disease detection & treatment',
    language === 'ne' ? 'PDF रिपोर्ट डाउनलोड' : 'PDF report download',
    language === 'ne' ? 'भ्वाइस सहायता' : 'Voice assistance',
    language === 'ne' ? 'प्राथमिकता समर्थन' : 'Priority support',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6" />
                    <span className="font-bold text-lg">
                      {language === 'ne' ? 'सदस्यता लिनुहोस्' : 'Subscribe Now'}
                    </span>
                  </div>
                  <p className="text-sm opacity-90">
                    {language === 'ne' 
                      ? `तपाईंले ${queriesUsed}/${queriesLimit} निःशुल्क प्रश्न प्रयोग गर्नुभयो`
                      : `You've used ${queriesUsed}/${queriesLimit} free queries`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground text-sm mb-4">
                {language === 'ne' 
                  ? 'असीमित कृषि सल्लाहका लागि सस्तो योजना रोज्नुहोस्:'
                  : 'Choose an affordable plan for unlimited farming advice:'}
              </p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Plans */}
              <div className="space-y-3">
                {/* Monthly */}
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={!!loading}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    loading === 'monthly' && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">
                        {SUBSCRIPTION_PLANS.monthly.nameNe} / {SUBSCRIPTION_PLANS.monthly.name}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ne' ? 'प्रति महिना' : 'per month'}
                      </p>
                    </div>
                    <div className="text-right">
                      {loading === 'monthly' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="font-bold text-lg">
                          रू {SUBSCRIPTION_PLANS.monthly.price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Yearly */}
                <button
                  onClick={() => handleSubscribe('yearly')}
                  disabled={!!loading}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all relative",
                    "hover:border-accent hover:bg-accent/5",
                    loading === 'yearly' && "border-accent bg-accent/5"
                  )}
                >
                  <div className="absolute -top-2 right-4 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                    {language === 'ne' ? '२ महिना बचत!' : 'Save 2 months!'}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">
                        {SUBSCRIPTION_PLANS.yearly.nameNe} / {SUBSCRIPTION_PLANS.yearly.name}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ne' ? 'प्रति वर्ष' : 'per year'}
                      </p>
                    </div>
                    <div className="text-right">
                      {loading === 'yearly' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="font-bold text-lg">
                          रू {SUBSCRIPTION_PLANS.yearly.price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {language === 'ne' 
                  ? 'जुनसुकै बेला रद्द गर्न सकिन्छ। सुरक्षित Stripe भुक्तानी।'
                  : 'Cancel anytime. Secure Stripe payment.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
