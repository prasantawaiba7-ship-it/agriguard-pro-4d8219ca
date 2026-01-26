import { useState } from 'react';
import { Crown, Calendar, MessageSquare, Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/hooks/useLanguage';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const SubscriptionCard = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const {
    subscribed,
    plan,
    subscription_end,
    queries_used,
    queries_limit,
    loading,
    checkSubscription,
    plans
  } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isNepali = language === 'ne';

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
  };

  // Get price from plans
  const getPrice = (planType: string) => {
    const planData = plans.find(p => p.plan_type === planType);
    return planData?.price || 0;
  };

  const getPlanDisplay = () => {
    if (plan === 'monthly') {
      return {
        name: isNepali ? 'मासिक प्रीमियम' : 'Monthly Premium',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-500',
        price: `रु. ${getPrice('monthly')}/महिना`
      };
    }
    if (plan === 'yearly') {
      return {
        name: isNepali ? 'वार्षिक प्रीमियम' : 'Yearly Premium',
        badge: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        price: `रु. ${getPrice('yearly')}/वर्ष`
      };
    }
    return {
      name: isNepali ? 'निःशुल्क' : 'Free',
      badge: 'bg-muted text-muted-foreground',
      price: isNepali ? 'निःशुल्क' : 'Free'
    };
  };

  const planInfo = getPlanDisplay();
  const queryPercentage = plan === 'free' ? (queries_used / queries_limit) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              {isNepali ? 'सदस्यता' : 'Subscription'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isNepali ? 'ताजा गर्नुहोस्' : 'Refresh'
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isNepali ? 'वर्तमान योजना' : 'Current Plan'}
              </p>
              <div className="flex items-center gap-2">
                <Badge className={`${planInfo.badge} text-white`}>
                  {planInfo.name}
                </Badge>
              </div>
            </div>
            {subscribed && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {isNepali ? 'मूल्य' : 'Price'}
                </p>
                <p className="font-semibold">{planInfo.price}</p>
              </div>
            )}
          </div>

          {/* Subscription End Date */}
          {subscribed && subscription_end && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {isNepali ? 'सदस्यता समाप्ति' : 'Subscription ends'}
                </p>
                <p className="font-medium">
                  {format(new Date(subscription_end), 'PPP')}
                </p>
              </div>
            </div>
          )}

          {/* Query Usage for Free Plan */}
          {!subscribed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isNepali ? 'AI प्रश्न प्रयोग' : 'AI Query Usage'}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {queries_used} / {queries_limit}
                </span>
              </div>
              <Progress value={queryPercentage} className="h-2" />
              {queries_used >= queries_limit && (
                <p className="text-xs text-destructive">
                  {isNepali 
                    ? 'तपाईंले सबै निःशुल्क प्रश्नहरू प्रयोग गर्नुभयो'
                    : 'You have used all free queries'}
                </p>
              )}
            </div>
          )}

          {/* Upgrade Button */}
          {!subscribed && (
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              <Crown className="w-4 h-4 mr-2" />
              {isNepali ? 'प्रीमियममा अपग्रेड गर्नुहोस्' : 'Upgrade to Premium'}
            </Button>
          )}

          {/* Manage Subscription for Premium - simplified for eSewa */}
          {subscribed && (
            <div className="text-center text-sm text-muted-foreground">
              {isNepali 
                ? 'तपाईंको सदस्यता सक्रिय छ'
                : 'Your subscription is active'}
            </div>
          )}
        </CardContent>
      </Card>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        queriesUsed={queries_used}
        queriesLimit={queries_limit}
      />
    </>
  );
};
