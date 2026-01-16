import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const isNepali = language === 'ne';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-orange-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-6 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">
              {isNepali ? 'भुक्तानी रद्द भयो' : 'Payment Cancelled'}
            </h1>
            <p className="text-orange-100">
              {isNepali ? 'तपाईंको भुक्तानी पूरा भएन' : 'Your payment was not completed'}
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {isNepali ? 'चिन्ता नगर्नुहोस्!' : "Don't worry!"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {isNepali 
                  ? 'तपाईंको खाताबाट कुनै पैसा काटिएको छैन। तपाईं जुनसुकै बेला सदस्यता लिन सक्नुहुन्छ।'
                  : 'No money has been charged from your account. You can subscribe anytime when you are ready.'}
              </p>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">
                {isNepali ? 'निःशुल्क योजनामा तपाईंसँग छ:' : 'With free plan you still have:'}
              </p>
              <p className="font-semibold text-foreground">
                {isNepali ? '३ वटा निःशुल्क AI प्रश्नहरू' : '3 free AI queries'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/krishi-mitra')}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isNepali ? 'पुनः प्रयास गर्नुहोस्' : 'Try Again'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/farmer')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isNepali ? 'ड्यासबोर्डमा फर्कनुहोस्' : 'Back to Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCancelled;
