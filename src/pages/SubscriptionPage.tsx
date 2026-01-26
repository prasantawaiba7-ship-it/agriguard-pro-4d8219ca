import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  Crown, Check, Star, Zap, Shield, Clock, 
  Loader2, AlertCircle, Sparkles, Award
} from 'lucide-react';
import { format } from 'date-fns';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { 
    subscribed, plan, subscription_end, queries_used, queries_limit,
    can_query, is_admin, loading: subLoading, 
    plans, plansLoading, startEsewaPayment 
  } = useSubscription();
  
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setProcessingPlan(planId);
    try {
      await startEsewaPayment(planId);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessingPlan(null);
    }
  };

  if (authLoading || subLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlanDetails = plans.find(p => p.plan_type === plan);
  const isPro = plan === 'monthly' || plan === 'yearly';

  // Group plans by type
  const freePlan = plans.find(p => p.plan_type === 'free');
  const paidPlans = plans.filter(p => p.plan_type !== 'free');

  return (
    <>
      <Helmet>
        <title>सदस्यता - Kisan Sathi</title>
        <meta name="description" content="Upgrade to Kisan Sathi Pro for unlimited features" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20 sm:pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <Crown className="h-8 w-8 text-primary" />
                Kisan Sathi सदस्यता
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Pro सदस्यता लिनुहोस् र सबै सुविधाहरूको पूर्ण पहुँच पाउनुहोस्।
              </p>
            </div>

            {/* Current Status Card */}
            {user && (
              <Card className={`mb-8 ${isPro ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30' : 'bg-muted/30'}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {isPro ? (
                          <Badge className="bg-primary text-primary-foreground gap-1">
                            <Crown className="h-3 w-3" />
                            Pro Member
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            Free Plan
                          </Badge>
                        )}
                        {is_admin && (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold">
                        तपाईंको हालको योजना: {currentPlanDetails?.name || plan}
                      </h2>
                      {subscription_end && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4" />
                          समाप्ति: {format(new Date(subscription_end), 'yyyy-MM-dd')}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {!is_admin && !isPro && (
                        <div className="text-sm text-muted-foreground mb-1">
                          AI Query: {queries_used}/{queries_limit}
                        </div>
                      )}
                      {!can_query && !is_admin && (
                        <div className="flex items-center gap-1 text-warning text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Query limit reached
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Plan */}
              {freePlan && (
                <Card className={`relative ${plan === 'free' ? 'ring-2 ring-primary' : ''}`}>
                  {plan === 'free' && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      हालको योजना
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-muted-foreground" />
                      {freePlan.name}
                    </CardTitle>
                    <CardDescription>
                      {freePlan.description || 'Basic features for getting started'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-6">
                      रु. 0
                      <span className="text-sm font-normal text-muted-foreground">/सधैं</span>
                    </div>
                    <ul className="space-y-3">
                      {(freePlan.features || []).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{freePlan.ai_call_limit || 3} AI queries/month</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" disabled>
                      {plan === 'free' ? 'Current Plan' : 'Free Forever'}
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* Paid Plans */}
              {paidPlans.map((planItem) => {
                const isCurrentPlan = plan === planItem.plan_type;
                const isPopular = planItem.plan_type === 'yearly';
                
                return (
                  <Card 
                    key={planItem.id}
                    className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''} ${isPopular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {isCurrentPlan && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        हालको योजना
                      </Badge>
                    )}
                    {isPopular && !isCurrentPlan && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success">
                        <Star className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className={`h-5 w-5 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                        {planItem.name}
                      </CardTitle>
                      <CardDescription>
                        {planItem.description || 'Full access to all features'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-6">
                        रु. {planItem.price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{planItem.plan_type === 'yearly' ? 'वर्ष' : 'महिना'}
                        </span>
                      </div>
                      <ul className="space-y-3">
                        {(planItem.features || []).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-success mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-start gap-2 text-sm">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                          <span>{planItem.ai_call_limit ? `${planItem.ai_call_limit} AI queries` : 'Unlimited AI queries'}</span>
                        </li>
                        {planItem.pdf_report_limit && (
                          <li className="flex items-start gap-2 text-sm">
                            <Award className="h-4 w-4 text-primary mt-0.5" />
                            <span>{planItem.pdf_report_limit} PDF reports/month</span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full gap-2" 
                        variant={isPopular ? 'default' : 'outline'}
                        disabled={isCurrentPlan || !!processingPlan}
                        onClick={() => handleSubscribe(planItem.id)}
                      >
                        {processingPlan === planItem.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Current Plan'
                        ) : (
                          <>
                            <Crown className="h-4 w-4" />
                            {isPro ? 'Switch Plan' : 'Upgrade Now'}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Sandbox Notice */}
            <Card className="mt-8 bg-warning/10 border-warning/30">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-warning flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  यो sandbox/test mode मा छ। वास्तविक भुक्तानी हुँदैन।
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default SubscriptionPage;
