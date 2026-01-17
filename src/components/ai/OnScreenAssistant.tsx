import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Mic, MicOff, Volume2, VolumeX, Loader2, X, MessageSquare, 
  Send, Download, Crown, Camera, RefreshCw, Minimize2, Maximize2,
  Globe, Leaf, Bug, CloudRain, HelpCircle, ImagePlus, WifiOff, Wifi, Scan, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSubscription } from '@/hooks/useSubscription';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSaveDiseaseDetection } from '@/hooks/useDiseaseHistory';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { DiseaseImageUpload } from '@/components/ai/DiseaseImageUpload';
import { DiseaseDetectionResult, DiseaseResult } from '@/components/ai/DiseaseDetectionResult';
import { offlineStorage } from '@/lib/offlineStorage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isOffline?: boolean;
  diseaseResult?: DiseaseResult;
  isAnalyzing?: boolean;
  isSaved?: boolean;
}

interface OnScreenAssistantProps {
  isFullScreen?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
}

// Quick action questions in different languages
const quickQuestions = {
  ne: [
    { icon: Camera, text: '📷 फोटो पठाएर रोग पहिचान गर्नुहोस्', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: 'मेरो बालीमा के समस्या छ?', color: 'text-destructive' },
    { icon: Leaf, text: 'कुन बाली लगाउँदा राम्रो हुन्छ?', color: 'text-primary' },
    { icon: HelpCircle, text: 'मलखाद कहिले हाल्ने?', color: 'text-warning' },
  ],
  hi: [
    { icon: Camera, text: '📷 फोटो भेजकर रोग पहचानें', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: 'मेरी फसल में क्या समस्या है?', color: 'text-destructive' },
    { icon: Leaf, text: 'कौन सी फसल लगाना अच्छा रहेगा?', color: 'text-primary' },
    { icon: HelpCircle, text: 'खाद कब डालें?', color: 'text-warning' },
  ],
  en: [
    { icon: Camera, text: '📷 Send photo to detect disease', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: "What's wrong with my crop?", color: 'text-destructive' },
    { icon: Leaf, text: 'Which crop should I plant?', color: 'text-primary' },
    { icon: HelpCircle, text: 'When to apply fertilizer?', color: 'text-warning' },
  ],
};

const languageOptions = [
  { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function OnScreenAssistant({ isFullScreen: isEmbeddedFullScreen = false, inputRef: externalInputRef }: OnScreenAssistantProps) {
  const { toast } = useToast();
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const saveDiseaseDetection = useSaveDiseaseDetection();
  
  // Hide floating button on Krishi Mitra page (only show embedded full screen version there)
  const isKrishiMitraPage = location.pathname === '/krishi-mitra';
  const [showPanel, setShowPanel] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDiseaseUpload, setShowDiseaseUpload] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [assistantLang, setAssistantLang] = useState(globalLanguage);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Use external ref if provided, otherwise use internal
  const inputRefToUse = externalInputRef || internalInputRef;
  
  // Use local language for assistant
  const language = assistantLang;
  
  // Get language key for quick questions (map to supported keys)
  const getQuickQuestionsLang = () => {
    if (assistantLang === 'hi') return 'hi';
    if (assistantLang === 'en') return 'en';
    return 'ne'; // Default to Nepali for all other languages
  };
  
  const handleLanguageChange = (langCode: 'ne' | 'hi' | 'en') => {
    setAssistantLang(langCode);
    setGlobalLanguage(langCode);
  };

  // Handle saving disease detection
  const handleSaveDiseaseResult = useCallback(async (messageIndex: number, imageUrl: string, result: DiseaseResult) => {
    if (!profile) {
      toast({
        title: language === 'ne' ? 'लगइन आवश्यक' : 'Login Required',
        description: language === 'ne' ? 'कृपया सुरक्षित गर्न लगइन गर्नुहोस्' : 'Please login to save results',
        variant: 'default'
      });
      return;
    }

    try {
      await saveDiseaseDetection.mutateAsync({ imageUrl, result, language });
      setMessages(prev => prev.map((msg, i) => 
        i === messageIndex ? { ...msg, isSaved: true } : msg
      ));
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [profile, language, saveDiseaseDetection, toast]);
  
  const { can_query, queries_used, queries_limit, subscribed, plan, incrementQueryCount, startCheckout, loading: subLoading } = useSubscription();

  // Faster TTS rate for quicker responses
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech({
    language,
    rate: 1.15, // Faster speaking rate
    pitch: 1,
    onError: (error) => {
      console.error('TTS Error:', error);
      // Silent fail - don't show error to user
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: language === 'ne' ? 'कृपया फोटो मात्र छान्नुहोस्।' : 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: language === 'ne' ? 'फोटो 5MB भन्दा सानो हुनुपर्छ।' : 'Image must be less than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [language, toast]);

  // Remove selected image
  const removeSelectedImage = useCallback(() => {
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, []);

  // Auto-focus input on embedded full screen mode
  useEffect(() => {
    if (isEmbeddedFullScreen && inputRefToUse.current) {
      const timer = setTimeout(() => {
        inputRefToUse.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isEmbeddedFullScreen, inputRefToUse]);

  // Get the speech recognition language code
  const getSpeechLang = useCallback(() => {
    switch (language) {
      case 'ne': return 'ne-NP'; // Nepali
      case 'hi': return 'hi-IN'; // Hindi
      default: return 'en-US';   // English
    }
  }, [language]);

  // Initialize speech recognition with error handling
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getSpeechLang();
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        setInputText(transcript);
        
        if (event.results[0].isFinal) {
          setIsListening(false);
          if (transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Friendly error messages without crashing
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showFriendlyError('mic_permission');
        } else if (event.error === 'network') {
          showFriendlyError('network');
        } else if (event.error === 'no-speech') {
          showFriendlyError('no_speech');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [getSpeechLang]);

  // Update recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getSpeechLang();
    }
  }, [language, getSpeechLang]);

  // Friendly error messages
  const showFriendlyError = useCallback((errorType: string) => {
    const messages: Record<string, { ne: string; hi: string; en: string }> = {
      mic_permission: {
        ne: 'माइक्रोफोन अनुमति छैन। कृपया टाइप गर्नुहोस्।',
        hi: 'माइक्रोफोन की अनुमति नहीं। कृपया टाइप करें।',
        en: 'Microphone not allowed. Please type instead.'
      },
      network: {
        ne: 'माफ गर्नुहोस्, जडानमा समस्या आयो। फेरि प्रयास गरौँ।',
        hi: 'माफ़ कीजिए, कनेक्शन में समस्या। फिर से प्रयास करें।',
        en: 'Connection issue. Please try again.'
      },
      no_speech: {
        ne: 'आवाज सुनिएन। कृपया फेरि बोल्नुहोस्।',
        hi: 'आवाज़ सुनाई नहीं दी। कृपया फिर से बोलें।',
        en: "Didn't hear you. Please speak again."
      },
      api_error: {
        ne: 'माफ गर्नुहोस्, जवाफ प्राप्त गर्न सकिएन। फेरि प्रयास गर्नुहोस्।',
        hi: 'माफ़ कीजिए, जवाब नहीं मिला। फिर से प्रयास करें।',
        en: 'Could not get response. Please try again.'
      }
    };

    const msg = messages[errorType] || messages.api_error;
    const errorMsg = language === 'ne' ? msg.ne : language === 'hi' ? msg.hi : msg.en;
    toast({
      title: language === 'ne' ? 'समस्या' : language === 'hi' ? 'समस्या' : 'Issue',
      description: errorMsg,
      variant: 'default'
    });
  }, [language, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showFriendlyError('mic_permission');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        showFriendlyError('mic_permission');
      }
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if ((!messageText && !selectedImage) || isLoading) return;

    // Check subscription - admins bypass subscription checks
    if (!can_query && !subscribed && !isAdmin()) {
      setShowSubscriptionModal(true);
      return;
    }

    const imageToSend = selectedImage;
    
    // Add user message with image if present
    const userMessage: Message = {
      role: 'user',
      content: messageText || (language === 'ne' ? 'यो फोटो हेर्नुहोस्' : language === 'hi' ? 'यह फोटो देखें' : 'Please check this photo'),
      timestamp: new Date(),
      imageUrl: imageToSend || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setIsLoading(true);

    // Check if offline - use cached responses
    if (!isOnline) {
      const offlineResponse = offlineStorage.getOfflineResponse(messageText);
      const aiMessage: Message = {
        role: 'assistant',
        content: offlineResponse,
        timestamp: new Date(),
        isOffline: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      
      // Auto-speak the response
      if (autoSpeak && ttsSupported && offlineResponse) {
        speak(offlineResponse);
      }
      return;
    }

    // Increment query count for free users
    if (!subscribed) {
      await incrementQueryCount();
    }

    try {
      // If image is present, run disease detection first
      if (imageToSend) {
        // Add analyzing message
        const analyzingMessage: Message = {
          role: 'assistant',
          content: language === 'ne' ? '🔬 फोटो विश्लेषण गर्दैछु...' : language === 'hi' ? '🔬 फोटो का विश्लेषण कर रहा हूँ...' : '🔬 Analyzing photo...',
          timestamp: new Date(),
          isAnalyzing: true
        };
        setMessages(prev => [...prev, analyzingMessage]);

        try {
          const diseaseResponse = await supabase.functions.invoke('analyze-crop-disease', {
            body: {
              imageUrl: imageToSend,
              description: messageText,
              language: language === 'ne' ? 'ne' : language === 'hi' ? 'hi' : 'en'
            }
          });

          // Remove analyzing message
          setMessages(prev => prev.filter(m => !m.isAnalyzing));

          if (diseaseResponse.error) throw diseaseResponse.error;

          const diseaseResult = diseaseResponse.data as DiseaseResult;
          
          // Add disease detection result message
          const resultMessage: Message = {
            role: 'assistant',
            content: diseaseResult.nepaliReport || diseaseResult.detectedIssue || '',
            timestamp: new Date(),
            diseaseResult
          };
          setMessages(prev => [...prev, resultMessage]);
          setIsLoading(false);

          // Auto-speak the result
          if (autoSpeak && ttsSupported) {
            const speakText = diseaseResult.isHealthy 
              ? (language === 'ne' ? 'तपाईंको बाली स्वस्थ देखिन्छ।' : 'Your crop appears healthy.')
              : `${diseaseResult.detectedIssue}. ${diseaseResult.treatment || ''}`;
            speak(speakText);
          }
          return;
        } catch (diseaseError) {
          console.error('Disease detection failed, falling back to general AI:', diseaseError);
          // Remove analyzing message and continue with general AI
          setMessages(prev => prev.filter(m => !m.isAnalyzing));
        }
      }

      // Prepare message content with image if present (fallback or non-image query)
      let messageContent: string | Array<{type: string; text?: string; image_url?: {url: string}}> = messageText || '';
      
      if (imageToSend) {
        // If we have an image, use multimodal format
        messageContent = [
          {
            type: 'text',
            text: messageText || (language === 'ne' ? 'कृपया यो बालीको फोटो हेरेर समस्या पहिचान गर्नुहोस् र सल्लाह दिनुहोस्।' : 
                  language === 'hi' ? 'कृपया इस फसल की फोटो देखकर समस्या पहचानें और सलाह दें।' :
                  'Please analyze this crop photo and identify any problems and provide advice.')
          },
          {
            type: 'image_url',
            image_url: { url: imageToSend }
          }
        ];
      }

      const response = await supabase.functions.invoke('ai-farm-assistant', {
        body: {
          messages: [
            ...messages.filter(m => !m.isAnalyzing).map(m => ({ 
              role: m.role, 
              content: m.imageUrl ? [
                { type: 'text', text: m.content },
                { type: 'image_url', image_url: { url: m.imageUrl } }
              ] : m.content 
            })),
            { role: 'user', content: messageContent }
          ],
          language,
          hasImage: !!imageToSend
        }
      });

      if (response.error) throw response.error;

      // Handle streaming response
      let fullResponse = '';
      
      if (response.data && typeof response.data.getReader === 'function') {
        const reader = response.data.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices?.[0]?.delta?.content) {
                  fullResponse += data.choices[0].delta.content;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } else if (response.data) {
        // Non-streaming response
        fullResponse = typeof response.data === 'string' 
          ? response.data 
          : response.data.response || response.data.content || JSON.stringify(response.data);
      }

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: fullResponse || (language === 'ne' ? 'माफ गर्नुहोस्, जवाफ प्राप्त भएन।' : language === 'hi' ? 'माफ़ कीजिए, जवाब नहीं मिला।' : 'Sorry, no response received.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Auto-speak the response immediately for faster experience
      if (autoSpeak && ttsSupported && fullResponse) {
        speak(fullResponse);
      }

    } catch (error) {
      console.error('AI error:', error);
      showFriendlyError('api_error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    stop();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setShowPanel(false);
    setIsFullScreen(false);
  };

  const clearChat = () => {
    setMessages([]);
    stop();
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1)); // Remove last AI response
      handleSendMessage(lastUserMessage.content);
    }
  };

  const downloadReport = async () => {
    if (messages.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { 
          conversation: messages.map(m => ({ role: m.role, content: m.content })), 
          language 
        }
      });

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => win.print();
      }
    } catch (error) {
      console.error('Report error:', error);
    }
  };

  // If embedded full screen mode, render directly without floating button
  if (isEmbeddedFullScreen) {
    return (
      <>
        <div className="flex flex-col h-full krishi-chat-container">
          {/* Header - Farm themed gradient */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 krishi-chat-header shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <span className="text-2xl sm:text-3xl">🌾</span>
              </div>
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-white">
                  {language === 'ne' ? 'कृषि मित्र AI सहायक' : language === 'hi' ? 'कृषि मित्र AI सहायक' : 'Krishi Mitra AI Assistant'}
                </h1>
                <p className="text-xs sm:text-sm text-white/80">
                  {language === 'ne' ? 'नेपाली वा English मा सोध्नुहोस्' : language === 'hi' ? 'नेपाली, हिन्दी या English में पूछें' : 'Ask in Nepali or English'}
                </p>
              </div>
              {subscribed && (
                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full flex items-center gap-1 ml-2">
                  <Crown className="w-3 h-3" />
                  {plan === 'monthly' ? (language === 'ne' ? 'Pro' : 'Pro') : 'Pro'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Offline Indicator */}
              {!isOnline && (
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Offline</span>
                </span>
              )}
              
              {!subscribed && (
                <span className="text-xs text-white/80 mr-1 hidden sm:inline">
                  {queries_used}/{queries_limit}
                </span>
              )}
              
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20" title="Change language">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  {languageOptions.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code as 'ne' | 'hi' | 'en')}
                      className={cn(
                        "cursor-pointer",
                        assistantLang === lang.code && "bg-primary/10 text-primary"
                      )}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span>{lang.label}</span>
                      {assistantLang === lang.code && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 sm:h-10 sm:w-10 text-white hover:bg-white/20"
                onClick={() => setAutoSpeak(!autoSpeak)}
                title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
              >
                {autoSpeak ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
                )}
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {/* Welcome Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="krishi-welcome-card rounded-3xl p-6 sm:p-8 max-w-lg mx-auto"
                >
                  <div className="text-6xl sm:text-7xl mb-4">🌾</div>
                  <h2 className="font-bold text-xl sm:text-2xl text-foreground mb-2">
                    {language === 'ne' ? 'नमस्ते दाइ/दिदी!' : language === 'hi' ? 'नमस्ते!' : 'Namaste!'}
                  </h2>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
                    {language === 'ne' 
                      ? 'म कृषि मित्र AI सहायक। तपाईंको बालीनालीका प्रश्नहरू नेपाली वा English मा लेखेर वा बोलेर सोध्नुहोस्। सकिन्छ भने बालीको फोटो पनि पठाउनुहोस्।' 
                      : language === 'hi'
                      ? 'मैं कृषि मित्र AI सहायक। अपने खेती के सवाल नेपाली, हिन्दी या English में लिखकर या बोलकर पूछें। हो सके तो फसल की फोटो भी भेजें।'
                      : "I'm Krishi Mitra AI Assistant. Ask your farming questions in Nepali or English by typing or speaking. You can also share crop photos for better diagnosis."}
                  </p>
                  
                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quickQuestions[getQuickQuestionsLang()].map((q, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => {
                          if ('isPhotoAction' in q && q.isPhotoAction) {
                            imageInputRef.current?.click();
                          } else {
                            handleSendMessage(q.text);
                          }
                        }}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border border-border bg-background/80",
                          "hover:border-primary/50 hover:bg-primary/5 transition-all text-left",
                          "text-sm sm:text-base touch-manipulation active:scale-95",
                          'isPhotoAction' in q && q.isPhotoAction && "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                        )}
                      >
                        <q.icon className={cn("w-5 h-5 sm:w-6 sm:h-6 shrink-0", q.color)} />
                        <span className="font-medium">{q.text}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 pt-4 border-t border-border/50">
                    <Mic className="w-4 h-4 text-primary" />
                    <span>
                      {language === 'ne' ? 'बोल्नुहोस्, टाइप गर्नुहोस्, वा फोटो पठाउनुहोस्' : 
                       language === 'hi' ? 'बोलें, टाइप करें, या फोटो भेजें' :
                       'Speak, type, or send a photo'}
                    </span>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg, i) => {
                  // Render disease detection result with special component
                  if (msg.diseaseResult) {
                    // Find the user message with image that triggered this result
                    const userMsgWithImage = messages.slice(0, i).reverse().find(m => m.role === 'user' && m.imageUrl);
                    const imageUrl = userMsgWithImage?.imageUrl || '';
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[90%] mr-auto"
                      >
                        <DiseaseDetectionResult 
                          result={msg.diseaseResult}
                          language={language}
                          onSpeak={ttsSupported ? (text) => speak(text) : undefined}
                          isSpeaking={isSpeaking}
                          onSave={profile ? () => handleSaveDiseaseResult(i, imageUrl, msg.diseaseResult!) : undefined}
                          isSaved={msg.isSaved}
                          imageUrl={imageUrl}
                        />
                      </motion.div>
                    );
                  }

                  // Render analyzing state
                  if (msg.isAnalyzing) {
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="krishi-chat-bubble-assistant rounded-2xl p-4 mr-auto flex items-center gap-3 max-w-[85%]"
                      >
                        <div className="relative">
                          <Scan className="w-6 h-6 text-primary" />
                          <motion.div
                            className="absolute inset-0 border-2 border-primary/50 rounded"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {language === 'ne' ? '🔬 फोटो विश्लेषण गर्दैछु...' : language === 'hi' ? '🔬 फोटो का विश्लेषण कर रहा हूँ...' : '🔬 Analyzing photo...'}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {language === 'ne' ? 'रोग र कीरा खोज्दैछु' : language === 'hi' ? 'रोग और कीट खोज रहा हूँ' : 'Detecting diseases and pests'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  }

                  // Regular message rendering
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 text-sm sm:text-base max-w-[85%]",
                        msg.role === 'user'
                          ? "krishi-chat-bubble-user text-primary-foreground ml-auto"
                          : "krishi-chat-bubble-assistant mr-auto"
                      )}
                    >
                      {/* Show image if present */}
                      {msg.imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-white/20">
                          <img 
                            src={msg.imageUrl} 
                            alt="Crop photo" 
                            className="max-w-full max-h-48 object-contain rounded-xl"
                          />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {/* Offline indicator */}
                      {msg.isOffline && (
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                          <WifiOff className="w-3 h-3" />
                          <span>{language === 'ne' ? 'अफलाइन जवाफ' : language === 'hi' ? 'ऑफलाइन जवाब' : 'Offline response'}</span>
                        </div>
                      )}
                      {/* Voice button for assistant messages */}
                      {msg.role === 'assistant' && ttsSupported && !msg.diseaseResult && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 h-8 px-3 text-xs bg-background/50 hover:bg-background/80 rounded-full"
                          onClick={() => isSpeaking ? stop() : speak(msg.content)}
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {isSpeaking 
                            ? (language === 'ne' ? 'रोक्नुहोस्' : language === 'hi' ? 'रोकें' : 'Stop') 
                            : (language === 'ne' ? 'सुन्नुहोस्' : language === 'hi' ? 'सुनें' : 'Listen')}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="krishi-chat-bubble-assistant rounded-2xl p-4 mr-auto flex items-center gap-3 max-w-[85%]"
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'ne' ? 'सोच्दैछु...' : language === 'hi' ? 'सोच रहा हूँ...' : 'Thinking...'}
                    </span>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area - Farm friendly soft background */}
          <div className="p-4 sm:p-6 border-t border-border/50 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Selected Image Preview */}
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative inline-block"
                >
                  <img 
                    src={selectedImage} 
                    alt="Selected crop" 
                    className="max-h-24 rounded-xl border-2 border-primary/30 shadow-md"
                  />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
              
              <div className="flex gap-2 sm:gap-3">
                {/* Image Upload Button */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || !!selectedImage}
                  className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 touch-manipulation rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5"
                  title={language === 'ne' ? 'फोटो थप्नुहोस्' : language === 'hi' ? 'फोटो जोड़ें' : 'Add photo'}
                >
                  <ImagePlus className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={cn(
                    "shrink-0 h-12 w-12 sm:h-14 sm:w-14 touch-manipulation rounded-xl border-2",
                    !isListening && "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  title={language === 'ne' ? 'बोल्नुहोस्' : language === 'hi' ? 'बोलें' : 'Speak'}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.div>
                  ) : (
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </Button>
                <Input
                  ref={inputRefToUse as RefObject<HTMLInputElement>}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedImage
                      ? (language === 'ne' ? 'फोटोको बारेमा सोध्नुहोस्...' : language === 'hi' ? 'फोटो के बारे में पूछें...' : 'Ask about the photo...')
                      : (language === 'ne' ? 'तपाईंको प्रश्न यहाँ लेख्नुहोस्...' : language === 'hi' ? 'अपना सवाल यहाँ लिखें...' : 'Type your question here...')
                  }
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg rounded-xl px-4 border-2 focus:border-primary"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !selectedImage) || isLoading}
                  size="icon"
                  className="shrink-0 h-12 w-12 sm:h-14 sm:w-14 touch-manipulation rounded-xl shadow-md"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
              </div>
              
              {isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-primary/10 border border-primary/20 mx-auto w-fit"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="w-2.5 h-2.5 rounded-full bg-destructive"
                  />
                  <span className="text-sm text-primary font-medium">
                    {language === 'ne' ? 'सुन्दैछु... बोल्नुहोस्' : language === 'hi' ? 'सुन रहा हूँ... बोलें' : 'Listening... speak now'}
                  </span>
                </motion.div>
              )}
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || !!selectedImage}
                  className="text-xs sm:text-sm h-9 sm:h-10 touch-manipulation rounded-lg"
                >
                  <Camera className="w-4 h-4 mr-1.5" />
                  {language === 'ne' ? 'फोटो पठाउनुहोस्' : language === 'hi' ? 'फोटो भेजें' : 'Send Photo'}
                </Button>
                {messages.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={retryLastMessage}
                      className="text-xs sm:text-sm h-9 sm:h-10 touch-manipulation rounded-lg"
                      title={language === 'ne' ? 'फेरि प्रयास' : 'Retry'}
                    >
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      {language === 'ne' ? 'फेरि' : language === 'hi' ? 'दोबारा' : 'Retry'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadReport}
                      className="text-xs sm:text-sm h-9 sm:h-10 touch-manipulation rounded-lg"
                      title={language === 'ne' ? 'रिपोर्ट' : 'Report'}
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      {language === 'ne' ? 'रिपोर्ट' : language === 'hi' ? 'रिपोर्ट' : 'Report'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearChat}
                      className="text-xs sm:text-sm h-9 sm:h-10 text-muted-foreground touch-manipulation rounded-lg"
                    >
                      {language === 'ne' ? 'मेटाउनुहोस्' : language === 'hi' ? 'मिटाएं' : 'Clear'}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Subscription CTA for free users */}
              {!subscribed && !subLoading && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-full text-xs sm:text-sm bg-accent/10 hover:bg-accent/20 text-accent h-10 touch-manipulation rounded-lg"
                >
                  <Crown className="w-4 h-4 mr-1.5" />
                  {language === 'ne' ? 'असीमित सल्लाहका लागि सदस्यता लिनुहोस्' : 
                   language === 'hi' ? 'असीमित सलाह के लिए सदस्यता लें' :
                   'Subscribe for unlimited advice'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribe={startCheckout}
          queriesUsed={queries_used}
          queriesLimit={queries_limit}
        />

        {/* Disease Upload Modal */}
        <AnimatePresence>
          {showDiseaseUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDiseaseUpload(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <DiseaseImageUpload onClose={() => setShowDiseaseUpload(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Panel classes based on screen size and fullscreen mode
  const panelClasses = cn(
    "fixed z-50 bg-card border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
    isFullScreen 
      ? "inset-0 rounded-none" // Full screen on mobile
      : "bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 md:w-[420px] rounded-2xl max-h-[85vh] sm:max-h-[75vh]"
  );

  return (
    <>
      {/* Floating Button - Hidden on Krishi Mitra page and in embedded full screen mode */}
      {!isKrishiMitraPage && !isEmbeddedFullScreen && (
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Button
            onClick={() => setShowPanel(!showPanel)}
            size="lg"
            className={cn(
              "rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg touch-manipulation",
              showPanel 
                ? "bg-primary hover:bg-primary/90" 
                : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
            )}
          >
            {isSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </motion.div>
            ) : isLoading ? (
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground animate-spin" />
            ) : (
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            )}
          </Button>

          {/* Pulse animation when speaking */}
          {isSpeaking && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </motion.div>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={panelClasses}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-sm sm:text-base">
                  {language === 'ne' ? '🌾 कृषि मित्र' : '🌾 Krishi Mitra'}
                </span>
                {subscribed && (
                  <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {plan === 'monthly' ? (language === 'ne' ? 'मासिक' : 'Pro') : (language === 'ne' ? 'वार्षिक' : 'Pro')}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Offline Indicator */}
                {!isOnline && (
                  <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                  </span>
                )}
                
                {!subscribed && (
                  <span className="text-xs text-muted-foreground mr-1">
                    {queries_used}/{queries_limit}
                  </span>
                )}
                
                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Change language">
                      <Globe className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    {languageOptions.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code as 'ne' | 'hi' | 'en')}
                        className={cn(
                          "cursor-pointer",
                          assistantLang === lang.code && "bg-primary/10 text-primary"
                        )}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        <span>{lang.label}</span>
                        {assistantLang === lang.code && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                >
                  {autoSpeak ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                {/* Fullscreen toggle for mobile */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:hidden"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-4 sm:py-6">
                  <div className="text-4xl sm:text-5xl mb-3">🌾</div>
                  <p className="font-medium text-foreground text-base sm:text-lg mb-1">
                    {language === 'ne' ? 'नमस्ते दाइ/दिदी!' : language === 'hi' ? 'नमस्ते!' : 'Namaste!'}
                  </p>
                  <p className="text-xs sm:text-sm max-w-[250px] mx-auto mb-4">
                    {language === 'ne' 
                      ? 'म तपाईंको कृषि मित्र। कृषि सम्बन्धी कुनै पनि प्रश्न सोध्नुहोस्!' 
                      : language === 'hi'
                      ? 'मैं आपका कृषि मित्र। खेती के बारे में कुछ भी पूछें!'
                      : "I'm your Krishi Mitra. Ask any farming question!"}
                  </p>
                  
                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 px-2 mb-4">
                    {quickQuestions[getQuickQuestionsLang()].map((q, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSendMessage(q.text)}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card",
                          "hover:border-primary/50 hover:bg-primary/5 transition-all text-left",
                          "text-xs sm:text-sm touch-manipulation active:scale-95"
                        )}
                      >
                        <q.icon className={cn("w-4 h-4 shrink-0", q.color)} />
                        <span className="line-clamp-2 leading-tight">{q.text}</span>
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Large Speak Now Button for voice-first farmers */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={cn(
                      "mx-auto flex flex-col items-center justify-center gap-2 p-6 sm:p-8 rounded-full",
                      "min-w-[140px] min-h-[140px] sm:min-w-[160px] sm:min-h-[160px]",
                      "touch-manipulation active:scale-95 transition-all duration-200",
                      "shadow-lg hover:shadow-xl",
                      isListening 
                        ? "bg-destructive text-destructive-foreground animate-pulse" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isListening ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                        >
                          <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
                        </motion.div>
                        <span className="text-sm sm:text-base font-medium">
                          {language === 'ne' ? 'सुन्दैछु...' : 
                           language === 'hi' ? 'सुन रहा हूँ...' :
                           'Listening...'}
                        </span>
                        <span className="text-xs opacity-80">
                          {language === 'ne' ? 'बोलिसक्दा थिच्नुहोस्' : 
                           language === 'hi' ? 'बोलने के बाद दबाएँ' :
                           'Tap when done'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                        <span className="text-sm sm:text-base font-bold">
                          {language === 'ne' ? '🎤 बोल्नुहोस्' : 
                           language === 'hi' ? '🎤 बोलें' :
                           '🎤 Speak Now'}
                        </span>
                        <span className="text-xs opacity-80">
                          {language === 'ne' ? 'नेपालीमा प्रश्न सोध्नुहोस्' : 
                           language === 'hi' ? 'हिंदी में पूछें' :
                           'Ask in your language'}
                        </span>
                      </>
                    )}
                  </motion.button>
                  
                  {/* Language indicator */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                    <Globe className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ne' ? 'नेपाली भाषा चयन गरिएको छ' : 
                       language === 'hi' ? 'हिंदी भाषा चुनी गई है' :
                       'English language selected'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === 'ne' ? 'वा तल टाइप गर्नुहोस्' : 
                     language === 'hi' ? 'या नीचे टाइप करें' :
                     'Or type below'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl p-3 text-sm max-w-[90%] sm:max-w-[85%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted mr-auto"
                    )}
                  >
                    {/* Show image if present */}
                    {msg.imageUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        <img 
                          src={msg.imageUrl} 
                          alt="Crop photo" 
                          className="max-w-full max-h-32 object-contain rounded-lg"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {/* Offline indicator */}
                    {msg.isOffline && (
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                        <WifiOff className="w-3 h-3" />
                        <span>{language === 'ne' ? 'अफलाइन' : 'Offline'}</span>
                      </div>
                    )}
                    {msg.role === 'assistant' && ttsSupported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 px-2 text-xs"
                        onClick={() => isSpeaking ? stop() : speak(msg.content)}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3 h-3 mr-1" />
                        ) : (
                          <Volume2 className="w-3 h-3 mr-1" />
                        )}
                        {isSpeaking 
                          ? (language === 'ne' ? 'बन्द' : 'Stop') 
                          : (language === 'ne' ? 'सुन्नुहोस्' : 'Listen')}
                      </Button>
                    )}
                  </motion.div>
                ))
              )}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-muted rounded-xl p-3 mr-auto flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'ne' ? 'सोच्दैछ...' : 'Thinking...'}
                  </span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-border bg-muted/30 shrink-0">
              {/* Selected Image Preview */}
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative inline-block mb-2"
                >
                  <img 
                    src={selectedImage} 
                    alt="Selected crop" 
                    className="max-h-16 rounded-lg border border-border"
                  />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              )}
              
              <div className="flex gap-2">
                {/* Image Upload Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading || !!selectedImage}
                  className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 touch-manipulation"
                  title={language === 'ne' ? 'फोटो थप्नुहोस्' : 'Add photo'}
                >
                  <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 touch-manipulation"
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    selectedImage
                      ? (language === 'ne' ? 'फोटोको बारेमा...' : 'About photo...')
                      : (language === 'ne' ? 'सोध्नुहोस्...' : 'Ask something...')
                  }
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !selectedImage) || isLoading}
                  size="icon"
                  className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 touch-manipulation"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-center text-primary mt-2"
                >
                  {language === 'ne' ? '🎤 सुन्दैछ...' : '🎤 Listening...'}
                </motion.p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-3 sm:px-4 pb-3 space-y-2 shrink-0">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDiseaseUpload(true)}
                  className="flex-1 text-xs h-9 touch-manipulation"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {language === 'ne' ? 'रोग पहिचान' : 'Disease Check'}
                </Button>
                {messages.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={retryLastMessage}
                      className="text-xs h-9 px-3 touch-manipulation"
                      title={language === 'ne' ? 'फेरि प्रयास' : 'Retry'}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadReport}
                      className="text-xs h-9 px-3 touch-manipulation"
                      title={language === 'ne' ? 'रिपोर्ट' : 'Report'}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Subscription CTA for free users - hidden for admins */}
              {!subscribed && !subLoading && !isAdmin() && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-full text-xs bg-accent/10 hover:bg-accent/20 text-accent h-9 touch-manipulation"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {language === 'ne' ? 'असीमित सल्लाहका लागि सदस्यता' : 'Subscribe for unlimited advice'}
                </Button>
              )}
              
              {messages.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  className="w-full text-xs text-muted-foreground h-8"
                >
                  {language === 'ne' ? 'च्याट मेटाउनुहोस्' : 'Clear chat'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={startCheckout}
        queriesUsed={queries_used}
        queriesLimit={queries_limit}
      />

      {/* Disease Upload Modal */}
      <AnimatePresence>
        {showDiseaseUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDiseaseUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <DiseaseImageUpload onClose={() => setShowDiseaseUpload(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
