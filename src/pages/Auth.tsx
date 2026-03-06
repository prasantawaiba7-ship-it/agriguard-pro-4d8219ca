import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Loader2, ArrowRight, Sprout, Eye, EyeOff, Wheat, Radio, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSelector } from '@/components/farmer/LanguageSelector';
import { useLanguage } from '@/hooks/useLanguage';
import { lovable } from '@/integrations/lovable/index';

const authSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    animate={{
      y: [0, -30, 0, 20, 0],
      x: [0, 15, -10, 5, 0],
      scale: [1, 1.08, 0.95, 1.03, 1],
    }}
    transition={{ duration: 18, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const Auth = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isNe = language === 'ne';

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  useEffect(() => {
    if (user) navigate('/krishi-mitra');
  }, [user, navigate]);

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    if (isNewUser) {
      const { error } = await signUp(data.email, data.password, data.fullName || 'Farmer');
      setIsLoading(false);
      if (error) {
        if (error.message.includes('already registered')) {
          form.setError('email', { message: isNe ? 'यो ईमेल पहिलेनै दर्ता भइसकेको छ।' : 'This email is already registered. Switch to Sign In.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    } else {
      const { error } = await signIn(data.email, data.password);
      setIsLoading(false);
      if (error) {
        form.setError('root', {
          message: error.message === 'Invalid login credentials'
            ? (isNe ? 'ईमेल वा पासवर्ड गलत छ।' : 'Invalid email or password.')
            : error.message,
        });
      }
    }
  };

  const trustItems = [
    { icon: Wheat, text: isNe ? 'नेपाली किसानहरूको भरोसा' : 'Trusted by Nepali Farmers' },
    { icon: Radio, text: isNe ? 'AI बाली रोग पहिचान' : 'AI Crop Disease Detection' },
    { icon: BarChart3, text: isNe ? 'स्मार्ट कृषि अन्तर्दृष्टि' : 'Smart Farming Insights' },
  ];

  return (
    <>
      <Helmet>
        <title>{isNe ? 'लगइन' : 'Login'} — {t('kisanSathi')}</title>
        <meta name="description" content="Sign in to Kisan Sathi — AI-powered smart farming for Nepali farmers." />
      </Helmet>

      <div
        className="min-h-screen relative flex flex-col items-center justify-start overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, hsl(148 35% 92%) 0%, hsl(152 28% 88%) 35%, hsl(90 20% 90%) 65%, hsl(42 30% 92%) 100%)',
        }}
      >
        {/* Animated floating orbs */}
        <FloatingOrb className="w-[280px] h-[280px] -top-20 -left-20 opacity-40 blur-3xl" delay={0}
          style={{ background: 'radial-gradient(circle, hsl(148 45% 72%), transparent 70%)' } as any}
        />
        <FloatingOrb className="w-[220px] h-[220px] top-[30%] -right-16 opacity-30 blur-3xl" delay={4}
          style={{ background: 'radial-gradient(circle, hsl(90 35% 75%), transparent 70%)' } as any}
        />
        <FloatingOrb className="w-[180px] h-[180px] bottom-[10%] left-[10%] opacity-25 blur-3xl" delay={8}
          style={{ background: 'radial-gradient(circle, hsl(42 50% 78%), transparent 70%)' } as any}
        />

        {/* Language selector */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>

        {/* Scrollable content */}
        <div className="w-full max-w-[400px] px-5 pt-12 pb-10 z-10 flex flex-col items-center">

          {/* Hero / Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-5 shadow-xl"
              style={{ background: 'linear-gradient(145deg, hsl(152 55% 32%), hsl(142 50% 28%))' }}
            >
              <Sprout className="w-9 h-9 text-white" strokeWidth={2} />
            </motion.div>

            <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">
              {t('kisanSathi')}
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              {isNe ? 'AI संचालित स्मार्ट कृषि' : 'AI-Powered Smart Farming'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2 max-w-[260px]">
              {isNe ? 'नेपाली किसानहरूलाई AI ले सशक्त बनाउँदै' : 'Empowering Nepali Farmers with AI'}
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-[28px] border border-white/60 shadow-2xl shadow-black/[0.06] p-6"
            style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Tab toggle */}
            <div className="flex rounded-2xl p-1 mb-6" style={{ background: 'hsl(148 20% 93%)' }}>
              {[false, true].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => { setIsNewUser(val); form.clearErrors(); }}
                  className={`flex-1 py-3 text-[13px] font-semibold rounded-[14px] transition-all duration-300 ${
                    isNewUser === val
                      ? 'bg-white text-foreground shadow-md shadow-black/[0.06]'
                      : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {val
                    ? (isNe ? 'नयाँ खाता' : 'Create Account')
                    : (isNe ? 'साइन इन' : 'Sign In')
                  }
                </button>
              ))}
            </div>

            {/* Google button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-[54px] text-[13px] font-semibold rounded-2xl gap-3 border-border/70 bg-white hover:bg-muted/30 shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isGoogleLoading}
              onClick={async () => {
                setIsGoogleLoading(true);
                setGoogleError(null);
                const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (result.error) {
                  setGoogleError(isNe ? 'Google साइन-इन असफल भयो।' : 'Google sign-in failed. Please try again.');
                  setIsGoogleLoading(false);
                }
              }}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isNe ? 'Google बाट जारी राख्नुहोस्' : 'Continue with Google'}
                </>
              )}
            </Button>

            {googleError && (
              <p className="text-xs text-destructive mt-2 text-center">{googleError}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-[0.1em]">
                {isNe ? 'वा ईमेलले' : 'or sign in with email'}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Email Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                {/* Name field for sign up */}
                {isNewUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                              <Input
                                placeholder={isNe ? 'पूरा नाम' : 'Full name'}
                                className="pl-11 h-[54px] text-sm rounded-2xl border-border/50 bg-white/70 focus:bg-white focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(148_45%_72%/0.15)] placeholder:text-muted-foreground/40 transition-all duration-200"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[11px] pl-1 mt-1" />
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
                      <FormControl>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            type="email"
                            placeholder={isNe ? 'ईमेल ठेगाना' : 'Email address'}
                            className="pl-11 h-[54px] text-sm rounded-2xl border-border/50 bg-white/70 focus:bg-white focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(148_45%_72%/0.15)] placeholder:text-muted-foreground/40 transition-all duration-200"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px] pl-1 mt-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={isNe ? 'पासवर्ड' : 'Password'}
                            className="pl-11 pr-12 h-[54px] text-sm rounded-2xl border-border/50 bg-white/70 focus:bg-white focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(148_45%_72%/0.15)] placeholder:text-muted-foreground/40 transition-all duration-200"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px] pl-1 mt-1" />
                    </FormItem>
                  )}
                />

                {/* Forgot password (sign in only) */}
                {!isNewUser && (
                  <div className="flex justify-end pt-0.5">
                    <button type="button" className="text-[11px] text-primary/70 hover:text-primary font-medium transition-colors">
                      {isNe ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}
                    </button>
                  </div>
                )}

                {/* Error message */}
                {form.formState.errors.root && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive bg-destructive/8 p-3 rounded-xl text-center"
                  >
                    {form.formState.errors.root.message}
                  </motion.p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-[54px] text-sm font-semibold rounded-2xl mt-2 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(152 55% 32%), hsl(142 50% 28%))',
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isNewUser
                        ? (isNe ? 'खाता बनाउनुहोस्' : 'Create Account')
                        : (isNe ? 'साइन इन गर्नुहोस्' : 'Sign In')
                      }
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Toggle prompt */}
            <p className="text-center text-[12px] text-muted-foreground mt-5">
              {isNewUser
                ? (isNe ? 'पहिले नै खाता छ? ' : 'Already have an account? ')
                : (isNe ? 'नयाँ किसान? ' : 'New farmer? ')
              }
              <button
                type="button"
                onClick={() => { setIsNewUser(!isNewUser); form.clearErrors(); }}
                className="text-primary font-semibold hover:underline underline-offset-2"
              >
                {isNewUser
                  ? (isNe ? 'साइन इन गर्नुहोस्' : 'Sign In')
                  : (isNe ? 'खाता बनाउनुहोस्' : 'Create an account')
                }
              </button>
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-3 mt-8"
          >
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-muted-foreground/60">
                <item.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Legal */}
          <p className="text-center text-[10px] text-muted-foreground/50 mt-6 leading-relaxed px-4">
            {isNe
              ? 'अगाडि बढ्दा, तपाईंले सेवा सर्तहरू र गोपनीयता नीतिमा सहमति जनाउनुहुन्छ।'
              : 'By continuing, you agree to our Terms of Service and Privacy Policy.'
            }
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
