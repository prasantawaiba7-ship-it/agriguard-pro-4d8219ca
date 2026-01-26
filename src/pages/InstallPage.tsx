import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Smartphone, Check, ArrowRight, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const isNepali = language === 'ne';

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: '🎤',
      title: isNepali ? 'भ्वाइस सहायक' : 'Voice Assistant',
      desc: isNepali ? 'नेपालीमा बोलेर सोध्नुहोस्' : 'Ask questions by speaking in Nepali'
    },
    {
      icon: '📴',
      title: isNepali ? 'अफलाइन पनि काम गर्छ' : 'Works Offline',
      desc: isNepali ? 'इन्टरनेट बिना पनि चल्छ' : 'Use even without internet'
    },
    {
      icon: '🌾',
      title: isNepali ? 'कृषि सल्लाह' : 'Farming Advice',
      desc: isNepali ? 'बाली, रोग, मौसम बारे सोध्नुहोस्' : 'Get advice on crops, diseases, weather'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isNepali ? 'कृषि मित्र' : 'Krishi Mitra'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isNepali ? 'तपाईंको कृषि सहायक' : 'Your Farming Assistant'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 gap-6 max-w-lg mx-auto w-full pt-20 pb-20">
        
        {/* Install Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {isInstalled ? (
                  <Check className="h-10 w-10 text-success" />
                ) : (
                  <Smartphone className="h-10 w-10 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {isInstalled 
                  ? (isNepali ? 'इन्स्टल भइसक्यो!' : 'Already Installed!')
                  : (isNepali ? 'एप इन्स्टल गर्नुहोस्' : 'Install the App')
                }
              </CardTitle>
              <CardDescription className="text-base">
                {isInstalled
                  ? (isNepali ? 'तपाईंको होम स्क्रीनबाट खोल्नुहोस्' : 'Open from your home screen')
                  : (isNepali ? 'ट्याब्लेट वा फोनमा राख्नुहोस्' : 'Add to your tablet or phone')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInstalled ? (
                <Button 
                  className="w-full h-14 text-lg"
                  onClick={() => navigate('/device')}
                >
                  {isNepali ? 'एप खोल्नुहोस्' : 'Open App'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : deferredPrompt ? (
                <Button 
                  className="w-full h-14 text-lg"
                  onClick={handleInstall}
                >
                  <Download className="h-5 w-5 mr-2" />
                  {isNepali ? 'अहिले इन्स्टल गर्नुहोस्' : 'Install Now'}
                </Button>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    {isNepali 
                      ? 'इन्स्टल गर्न ब्राउजर मेनु खोल्नुहोस्:'
                      : 'To install, use your browser menu:'
                    }
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p><strong>iPhone/iPad:</strong> {isNepali ? 'Share → Add to Home Screen' : 'Share → Add to Home Screen'}</p>
                    <p><strong>Android:</strong> {isNepali ? 'Menu (⋮) → Install app' : 'Menu (⋮) → Install app'}</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => navigate('/device')}
                  >
                    {isNepali ? 'ब्राउजरमै प्रयोग गर्नुहोस्' : 'Use in Browser'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <div className="w-full space-y-3">
          <h2 className="text-lg font-semibold text-center text-muted-foreground">
            {isNepali ? 'के के गर्न सकिन्छ?' : 'What can you do?'}
          </h2>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 bg-card/50 rounded-xl p-4 border border-border/50"
            >
              <span className="text-3xl">{feature.icon}</span>
              <div>
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border/50 text-center">
        <p className="text-sm text-muted-foreground">
          {isNepali ? 'नेपाली किसानहरूको लागि बनाइएको' : 'Made for Nepali farmers'} 🇳🇵
        </p>
      </footer>
    </div>
  );
}
