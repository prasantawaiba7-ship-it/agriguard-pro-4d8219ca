import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Loader2, ArrowRight, Sprout } from 'lucide-react';
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

const Auth = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
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
          form.setError('email', { message: 'This email is already registered. Switch to Sign In.' });
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

  return (
    <>
      <Helmet>
        <title>{isNe ? 'लगइन' : 'Login'} - {t('kisanSathi')}</title>
        <meta name="description" content="Sign in to access your farming dashboard." />
      </Helmet>

      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden px-5 py-10"
        style={{
          background: 'linear-gradient(160deg, hsl(142 40% 95%) 0%, hsl(160 30% 90%) 30%, hsl(80 25% 92%) 60%, hsl(45 40% 93%) 100%)',
        }}
      >
        {/* Floating orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(142 50% 70%), transparent 70%)' }} />
        <div className="absolute bottom-[-8%] right-[-8%] w-[45vw] h-[45vw] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(45 60% 75%), transparent 70%)' }} />

        {/* Language switch */}
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[380px] z-10"
        >
          {/* Brand */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 shadow-xl"
              style={{ background: 'linear-gradient(135deg, hsl(142 60% 42%), hsl(160 55% 36%))' }}
            >
              <Sprout className="w-8 h-8 text-white" strokeWidth={2.2} />
            </motion.div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">{t('kisanSathi')}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isNe ? 'तपाईंको कृषि साथी' : 'Your farming companion'}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-black/5 p-6">
            {/* Toggle */}
            <div className="flex rounded-2xl bg-muted/60 p-1 mb-6">
              {[false, true].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setIsNewUser(val)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    isNewUser === val
                      ? 'bg-white text-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {val
                    ? (isNe ? 'खाता बनाउनुहोस्' : 'Sign Up')
                    : (isNe ? 'लगइन' : 'Sign In')
                  }
                </button>
              ))}
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-[52px] text-sm font-semibold rounded-2xl gap-3 border-border/80 bg-white hover:bg-muted/40 shadow-sm"
              disabled={isGoogleLoading}
              onClick={async () => {
                setIsGoogleLoading(true);
                setGoogleError(null);
                const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (result.error) {
                  setGoogleError(isNe ? 'Google साइन-इन असफल भयो।' : 'Google sign-in failed.');
                  setIsGoogleLoading(false);
                }
              }}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {isNe ? 'वा ईमेलले' : 'or email'}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                <AnimatePresence>
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
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
                                <Input
                                  placeholder={isNe ? 'पूरा नाम' : 'Full name'}
                                  className="pl-11 h-[52px] text-sm rounded-2xl border-border/60 bg-white/80 focus:bg-white placeholder:text-muted-foreground/50"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs pl-1" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
                          <Input
                            type="email"
                            placeholder={isNe ? 'ईमेल ठेगाना' : 'Email address'}
                            className="pl-11 h-[52px] text-sm rounded-2xl border-border/60 bg-white/80 focus:bg-white placeholder:text-muted-foreground/50"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs pl-1" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60" />
                          <Input
                            type="password"
                            placeholder={isNe ? 'पासवर्ड' : 'Password'}
                            className="pl-11 h-[52px] text-sm rounded-2xl border-border/60 bg-white/80 focus:bg-white placeholder:text-muted-foreground/50"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs pl-1" />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-destructive bg-destructive/8 p-3 rounded-xl text-center"
                  >
                    {form.formState.errors.root.message}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full h-[52px] text-sm font-semibold rounded-2xl mt-1 shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isNewUser
                        ? (isNe ? 'खाता बनाउनुहोस्' : 'Create Account')
                        : (isNe ? 'लगइन गर्नुहोस्' : 'Sign In')
                      }
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-muted-foreground/70 mt-6 leading-relaxed px-2">
            {isNe
              ? 'अगाडि बढ्दा, तपाईंले सेवा सर्तहरू र गोपनीयता नीतिमा सहमति जनाउनुहुन्छ।'
              : 'By continuing, you agree to our Terms of Service and Privacy Policy.'
            }
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
