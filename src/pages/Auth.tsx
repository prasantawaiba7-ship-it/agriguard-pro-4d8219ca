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
      // Sign up flow
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
      // Sign in flow
      const { error } = await signIn(data.email, data.password);
      setIsLoading(false);
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          form.setError('root', { message: 'Invalid email or password. Check "New User" if you need to create an account.' });
        } else {
          form.setError('root', { message: error.message });
        }
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - CROPIC</title>
        <meta name="description" content="Sign in to CROPIC to manage your crop monitoring and access AI-powered farming insights." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-3 sm:p-4">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <LanguageSelector />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[95%] sm:max-w-md"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary mb-3 sm:mb-4">
              <Leaf className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Farmer Gpt</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">AI-Powered Farming Assistant</p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">Farmer Login</CardTitle>
              <CardDescription className="text-sm">
                Enter your details to access your dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* New User Checkbox */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <input
                      type="checkbox"
                      id="newUser"
                      checked={isNewUser}
                      onChange={(e) => setIsNewUser(e.target.checked)}
                      className="w-5 h-5 rounded border-input accent-primary cursor-pointer"
                    />
                    <label htmlFor="newUser" className="text-sm font-medium cursor-pointer flex-1">
                      I am a new user (create account)
                    </label>
                  </div>

                  {/* Full Name - only for new users */}
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
                            <FormLabel className="text-sm">Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Enter your full name" className="pl-10 h-11 text-base" {...field} />
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
                        <FormLabel className="text-sm">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder="Enter your email" className="pl-10 h-11 text-base" {...field} />
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
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="Enter your password" className="pl-10 h-11 text-base" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-xs sm:text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isNewUser ? 'Create Account & Login' : 'Login to Dashboard'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-4 sm:mt-6 px-4">
            By continuing, you agree to CROPIC's Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
