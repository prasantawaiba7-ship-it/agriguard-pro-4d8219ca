import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscription } from '@/hooks/useSubscription';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { checkSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription status after successful payment
    checkSubscription();
  }, [checkSubscription]);

  const isNepali = language === 'ne';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-green-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">
              {isNepali ? 'भुक्तानी सफल!' : 'Payment Successful!'}
            </h1>
            <p className="text-green-100">
              {isNepali ? 'तपाईंको सदस्यता सक्रिय भयो' : 'Your subscription is now active'}
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">
                  {isNepali ? 'अब तपाईंले पाउनुहुन्छ:' : 'You now have access to:'}
                </span>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isNepali ? 'असीमित AI प्रश्नहरू' : 'Unlimited AI queries'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isNepali ? 'बाली रोग विश्लेषण' : 'Crop disease analysis'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isNepali ? 'PDF प्रतिवेदन डाउनलोड' : 'PDF report downloads'}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {isNepali ? 'प्राथमिकता सहयोग' : 'Priority support'}
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/krishi-mitra')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isNepali ? 'कृषि मित्र प्रयोग गर्नुहोस्' : 'Start Using Krishi Mitra'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/farmer/profile')}
                className="w-full"
              >
                {isNepali ? 'प्रोफाइल हेर्नुहोस्' : 'View Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
