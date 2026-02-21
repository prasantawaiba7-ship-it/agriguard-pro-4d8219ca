import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSelector } from '@/components/farmer/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';

const authSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (user) {
      navigate('/krishi-mitra');
    }
  }, [user, navigate]);

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    
    if (isNewUser) {
      const { error } = await signUp(data.email, data.password, data.fullName || 'Farmer');
      setIsLoading(false);
      
      if (error) {
        if (error.message.includes('already registered')) {
          form.setError('email', { message: 'This email is already registered. Uncheck "New User" to sign in.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    } else {
      const { error } = await signIn(data.email, data.password);
      setIsLoading(false);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          form.setError('root', { message: language === 'ne' ? 'ईमेल वा पासवर्ड गलत छ।' : 'Invalid email or password. Check "New User" if you need to create an account.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{language === 'ne' ? 'लगइन' : 'Login'} - {t('kisanSathi')}</title>
        <meta name="description" content="Sign in to access your farming dashboard." />
      </Helmet>

      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle background decorations */}
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <LanguageSelector />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-lg">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('kisanSathi')}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {language === 'ne' ? 'AI-संचालित खेती सहायक' : 'AI-Powered Farming Assistant'}
            </p>
          </div>

          <Card className="border-border/50 shadow-xl backdrop-blur-sm">
            <CardHeader className="text-center px-5 py-5">
              <CardTitle className="text-lg">
                {language === 'ne' ? 'किसान लगइन' : 'Farmer Login'}
              </CardTitle>
              <CardDescription className="text-sm">
                {language === 'ne' ? 'आफ्नो डाशबोर्डमा जानुहोस्' : 'Access your farming dashboard'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/60">
                    <input
                      type="checkbox"
                      id="newUser"
                      checked={isNewUser}
                      onChange={(e) => setIsNewUser(e.target.checked)}
                      className="w-5 h-5 rounded border-input accent-primary cursor-pointer"
                    />
                    <label htmlFor="newUser" className="text-sm font-medium cursor-pointer flex-1">
                      {language === 'ne' ? 'नयाँ प्रयोगकर्ता (खाता बनाउनुहोस्)' : 'I am a new user (create account)'}
                    </label>
                  </div>

                  {isNewUser && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">{language === 'ne' ? 'पूरा नाम' : 'Full Name'}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder={language === 'ne' ? 'तपाईंको नाम' : 'Your name'} className="pl-10 h-12 text-base rounded-xl" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{language === 'ne' ? 'ईमेल' : 'Email'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder={language === 'ne' ? 'ईमेल हाल्नुहोस्' : 'Enter your email'} className="pl-10 h-12 text-base rounded-xl" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">{language === 'ne' ? 'पासवर्ड' : 'Password'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder={language === 'ne' ? 'पासवर्ड हाल्नुहोस्' : 'Enter your password'} className="pl-10 h-12 text-base rounded-xl" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isNewUser 
                          ? (language === 'ne' ? 'खाता बनाउनुहोस्' : 'Create Account & Login')
                          : (language === 'ne' ? 'लगइन गर्नुहोस्' : 'Login to Dashboard')
                        }
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-[10px] text-muted-foreground mt-5 px-4">
            {language === 'ne' 
              ? 'अगाडि बढ्दा, तपाईंले सेवा सर्तहरू र गोपनीयता नीतिमा सहमति जनाउनुहुन्छ।'
              : "By continuing, you agree to our Terms of Service and Privacy Policy."
            }
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
