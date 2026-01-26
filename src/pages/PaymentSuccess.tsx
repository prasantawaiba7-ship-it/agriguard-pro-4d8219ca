import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscription } from '@/hooks/useSubscription';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { verifyPayment, checkSubscription } = useSubscription();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEsewaPayment = async () => {
      const transactionUuid = searchParams.get('transaction_uuid');
      const data = searchParams.get('data'); // eSewa encoded response
      
      if (!transactionUuid) {
        // No transaction UUID, just refresh subscription (might be Stripe redirect)
        await checkSubscription();
        setVerified(true);
        setVerifying(false);
        return;
      }

      try {
        const result = await verifyPayment(transactionUuid, data || undefined);
        if (result.success) {
          setVerified(true);
        } else {
          setError(result.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to verify payment');
      } finally {
        setVerifying(false);
      }
    };

    verifyEsewaPayment();
  }, [searchParams, verifyPayment, checkSubscription]);

  const isNepali = language === 'ne';

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">
              {isNepali ? 'भुक्तानी प्रमाणित गर्दै...' : 'Verifying Payment...'}
            </h2>
            <p className="text-muted-foreground">
              {isNepali ? 'कृपया पर्खनुहोस्' : 'Please wait'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-destructive/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2 text-destructive">
              {isNepali ? 'भुक्तानी असफल' : 'Payment Failed'}
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/farmer/profile')} variant="outline">
              {isNepali ? 'प्रोफाइलमा फर्कनुहोस्' : 'Back to Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
