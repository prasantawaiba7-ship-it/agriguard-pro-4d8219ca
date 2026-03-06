import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Mic, MicOff, Volume2, VolumeX, Loader2, X, MessageSquare, 
  Send, Download, Crown, Camera, RefreshCw, Minimize2, Maximize2,
  Globe, Leaf, Bug, CloudRain, HelpCircle, ImagePlus, WifiOff, Wifi, Scan, Calendar, History, FileDown, CloudSun, Phone
} from 'lucide-react';
import { WeatherAdvisoryCard } from '@/components/ai/WeatherAdvisoryCard';
import { RealtimeVoiceChat } from '@/components/ai/RealtimeVoiceChat';
import { VoiceFarmingAssistant } from '@/components/ai/VoiceFarmingAssistant';
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
import { useAIChatStore } from '@/hooks/useAIChatStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { DiseaseImageUpload } from '@/components/ai/DiseaseImageUpload';
import { DiseaseDetectionResult, DiseaseResult } from '@/components/ai/DiseaseDetectionResult';
import { ChatHistoryModal } from '@/components/ai/ChatHistoryModal';
import { offlineStorage } from '@/lib/offlineStorage';
import { format } from 'date-fns';
import { VoiceNoteRecorder } from '@/components/voice/VoiceNoteRecorder';
import { VoiceNoteBubble } from '@/components/voice/VoiceNoteBubble';
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

// Farmer-first bilingual suggestion chips
const quickQuestions = {
  ne: [
    { icon: Camera, text: 'फोटो पठाउनुहोस्', subtext: 'Send crop photo', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: 'मेरो बालीमा के भयो?', subtext: "What's wrong with my crop?", color: 'text-destructive' },
    { icon: CloudSun, text: 'आज के गर्ने?', subtext: "What to do today?", color: 'hsl(var(--warning))' },
    { icon: Leaf, text: 'कुन बाली लगाउने?', subtext: 'Which crop to plant?', color: 'text-primary' },
    { icon: HelpCircle, text: 'मल कति हाल्ने?', subtext: 'Fertilizer advice', color: 'text-secondary' },
  ],
  hi: [
    { icon: Camera, text: 'फोटो भेजें', subtext: 'Send crop photo', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: 'फसल में क्या समस्या है?', subtext: "What's wrong?", color: 'text-destructive' },
    { icon: CloudSun, text: 'आज क्या करें?', subtext: "What to do today?", color: 'hsl(var(--warning))' },
    { icon: Leaf, text: 'कौन सी फसल लगाएँ?', subtext: 'Which crop?', color: 'text-primary' },
    { icon: HelpCircle, text: 'खाद कितनी डालें?', subtext: 'Fertilizer advice', color: 'text-secondary' },
  ],
  en: [
    { icon: Camera, text: 'Send photo', subtext: 'Detect crop disease', color: 'text-destructive', isPhotoAction: true },
    { icon: Bug, text: "What's wrong?", subtext: 'Describe your problem', color: 'text-destructive' },
    { icon: CloudSun, text: "What to do today?", subtext: 'Weather-based advice', color: 'hsl(var(--warning))' },
    { icon: Leaf, text: 'Which crop?', subtext: 'Best crop for my land', color: 'text-primary' },
    { icon: HelpCircle, text: 'Fertilizer help', subtext: 'How much to apply?', color: 'text-secondary' },
  ],
};

const languageOptions = [
  { code: 'ne', label: 'नेपाली', flag: '🇳🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function OnScreenAssistant({ isFullScreen: isEmbeddedFullScreen = false, inputRef: externalInputRef }: OnScreenAssistantProps) {
  // ===== ALL HOOKS MUST BE AT TOP LEVEL AND IN CONSISTENT ORDER =====
  const { toast } = useToast();
  const { language: globalLanguage, setLanguage: setGlobalLanguage } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const saveDiseaseDetection = useSaveDiseaseDetection();
  
  // Global chat state from zustand store
  const { 
    messages: storeMessages, 
    isLoading: storeIsLoading,
    setMessages: setStoreMessages,
    addMessage: addStoreMessage,
    updateLastMessage: updateStoreLastMessage,
    setIsLoading: setStoreIsLoading,
    clearMessages: clearStoreMessages,
    sessionId: storeSessionId
  } = useAIChatStore();

  // ===== STATE HOOKS (keep together) =====
  const isKrishiMitraPage = location.pathname === '/krishi-mitra';
  const [showPanel, setShowPanel] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDiseaseUpload, setShowDiseaseUpload] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [assistantLang, setAssistantLang] = useState(globalLanguage);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [sessionId] = useState(() => storeSessionId || crypto.randomUUID());
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showOfflinePremiumPrompt, setShowOfflinePremiumPrompt] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showVoiceNoteRecorder, setShowVoiceNoteRecorder] = useState(false);

  // ===== REF HOOKS (keep together) =====
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // ===== SUBSCRIPTION HOOK (must be called unconditionally before TTS) =====
  const { can_query, queries_used, queries_limit, subscribed, plan, incrementQueryCount, loading: subLoading } = useSubscription();
  
  // ===== TTS HOOK (called unconditionally with stable language) =====
  const ttsHook = useTextToSpeech({
    language: assistantLang,
    rate: 1.15,
    pitch: 1,
    onError: (error) => {
      console.error('TTS Error:', error);
    }
  });
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = ttsHook;
  
  // Use external ref if provided, otherwise use internal
  const inputRefToUse = externalInputRef || internalInputRef;

  // Sync local state with store on mount/navigation
  useEffect(() => {
    if (!hasInitialized && storeMessages.length > 0) {
      // Restore messages from store when navigating back
      const restoredMessages: Message[] = storeMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.timestamp),
        imageUrl: m.imageUrl
      }));
      setMessages(restoredMessages);
      // Never restore isLoading — always start fresh to avoid stuck state
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [storeMessages, storeIsLoading, hasInitialized]);

  // Sync messages to store whenever they change
  useEffect(() => {
    if (messages.length > 0 && hasInitialized) {
      const storeFormat = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        imageUrl: m.imageUrl
      }));
      setStoreMessages(storeFormat);
    }
  }, [messages, hasInitialized, setStoreMessages]);

  // Sync loading state to store
  useEffect(() => {
    setStoreIsLoading(isLoading);
  }, [isLoading, setStoreIsLoading]);

  // Load chat history for logged-in users
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!profile?.id) return;
      
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('*')
          .eq('farmer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Convert to Message format and reverse to show oldest first
          const loadedMessages: Message[] = data.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            imageUrl: msg.image_url || undefined
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [profile?.id]);

  // Save message to database
  const saveMessageToDb = useCallback(async (
    role: 'user' | 'assistant', 
    content: string, 
    imageUrl?: string
  ) => {
    if (!profile?.id || !content) return;
    
    try {
      await supabase.from('ai_chat_history').insert({
        farmer_id: profile.id,
        session_id: sessionId,
        role,
        content,
        image_url: imageUrl || null,
        language: assistantLang,
        message_type: imageUrl ? 'image' : 'text'
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [profile?.id, sessionId, assistantLang]);
  
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load pending messages count on mount
  useEffect(() => {
    const pending = offlineStorage.getPendingMessages();
    setPendingCount(pending.length);
  }, []);

  // Process queued messages when coming back online
  useEffect(() => {
    if (isOnline) {
      const pending = offlineStorage.getPendingMessages();
      if (pending.length > 0) {
        toast({
          title: language === 'ne' ? '🌐 अनलाइन भयो!' : '🌐 Back Online!',
          description: language === 'ne' 
            ? `${pending.length} पेन्डिङ प्रश्नहरू पठाउँदैछु...` 
            : `Sending ${pending.length} pending question(s)...`,
        });
        
        // Process each pending message
        pending.forEach(async (pendingMsg, index) => {
          // Small delay between messages to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, index * 1000));
          
          const lastMessage = pendingMsg.messages[pendingMsg.messages.length - 1];
          if (lastMessage && lastMessage.content) {
            handleSendMessage(lastMessage.content, lastMessage.imageUrl);
          }
          
          // Remove from queue after processing
          offlineStorage.removePendingMessage(pendingMsg.id);
          setPendingCount(prev => Math.max(0, prev - 1));
        });
      }
    }
  }, [isOnline]);

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

  const handleSendMessage = async (text?: string, imageFromQueue?: string) => {
    const messageText = text || inputText.trim();
    if ((!messageText && !selectedImage && !imageFromQueue) || isLoading) return;

    // Check subscription - admins bypass subscription checks
    if (!can_query && !subscribed && !isAdmin()) {
      setShowSubscriptionModal(true);
      return;
    }

    const imageToSend = imageFromQueue || selectedImage;
    
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

    // Save user message to database
    saveMessageToDb('user', userMessage.content, imageToSend || undefined);

    // Check if offline - queue message and show cached response
    if (!isOnline) {
      // Queue the message for later sending
      const pendingMessage = {
        id: crypto.randomUUID(),
        messages: [{ role: 'user', content: messageText, imageUrl: imageToSend }],
        timestamp: new Date()
      };
      offlineStorage.queuePendingMessage(pendingMessage);
      setPendingCount(prev => prev + 1);
      
      // Show offline indicator on user message
      setMessages(prev => prev.map((msg, i) => 
        i === prev.length - 1 ? { ...msg, isOffline: true } : msg
      ));
      
      // Show cached response
      const offlineResponse = offlineStorage.getOfflineResponse(messageText);
      const aiMessage: Message = {
        role: 'assistant',
        content: offlineResponse + (language === 'ne' 
          ? '\n\n📤 **तपाईंको प्रश्न सुरक्षित गरियो।** इन्टरनेट आएपछि पठाइनेछ।'
          : '\n\n📤 **Your question has been saved.** It will be sent when you\'re back online.'),
        timestamp: new Date(),
        isOffline: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      
      toast({
        title: language === 'ne' ? '📴 अफलाइन मोड' : '📴 Offline Mode',
        description: language === 'ne' 
          ? 'प्रश्न सुरक्षित गरियो। अनलाइन हुँदा पठाइनेछ।' 
          : 'Question saved. Will be sent when online.',
      });
      
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

          // Save assistant response to database
          saveMessageToDb('assistant', resultMessage.content);

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

      // Use fetch directly for proper SSE streaming support
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-farm-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response with real-time UI updates
      let fullResponse = '';
      
      // Add empty assistant message that we'll update as we stream
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);
      
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });
          
          // Process line-by-line as data arrives
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                // Update the last message in real-time
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: fullResponse
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Incomplete JSON, put back and wait for more
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }

      // If no response received, show error message
      if (!fullResponse) {
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: language === 'ne' ? 'माफ गर्नुहोस्, जवाफ प्राप्त भएन। कृपया पुनः प्रयास गर्नुहोस्।' : 
                       language === 'hi' ? 'माफ़ कीजिए, जवाब नहीं मिला। कृपया दोबारा प्रयास करें।' : 
                       'Sorry, no response received. Please try again.'
            };
          }
          return updated;
        });
      }

      // Save assistant response to database
      if (fullResponse) {
        saveMessageToDb('assistant', fullResponse);
      }

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

  const clearChat = async () => {
    setMessages([]);
    clearStoreMessages(); // Clear zustand store
    stop();
    
    // Clear chat history from database for this user
    if (profile?.id) {
      try {
        await supabase
          .from('ai_chat_history')
          .delete()
          .eq('farmer_id', profile.id);
      } catch (error) {
        console.error('Failed to clear chat history:', error);
      }
    }
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
    
    setIsExportingPdf(true);
    try {
      // Generate styled HTML for the chat
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const title = language === 'ne' ? 'Farmer Gpt कुराकानी' : language === 'hi' ? 'Farmer Gpt बातचीत' : 'Farmer Gpt Chat';
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #f8fafc; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #22c55e; }
    .header h1 { color: #166534; font-size: 24px; margin-bottom: 5px; }
    .header p { color: #6b7280; font-size: 14px; }
    .message { margin-bottom: 16px; padding: 16px; border-radius: 12px; }
    .user { background: #dcfce7; margin-left: 40px; border: 1px solid #bbf7d0; }
    .assistant { background: white; margin-right: 40px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .role { font-weight: 600; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
    .user .role { color: #166534; }
    .assistant .role { color: #3b82f6; }
    .content { white-space: pre-wrap; line-height: 1.6; color: #1f2937; }
    .time { font-size: 11px; color: #9ca3af; margin-top: 8px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    @media print { body { padding: 20px; background: white; } .message { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${language === 'ne' ? 'निर्यात मिति' : language === 'hi' ? 'निर्यात तिथि' : 'Exported on'}: ${dateStr}</p>
  </div>
  ${messages.map(m => `
    <div class="message ${m.role}">
      <div class="role">${m.role === 'user' ? (language === 'ne' ? 'तपाईं' : language === 'hi' ? 'आप' : 'You') : (language === 'ne' ? 'किसान साथी' : 'Kisan Sathi')}</div>
      <div class="content">${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div class="time">${format(m.timestamp, 'MMM d, yyyy h:mm a')}</div>
    </div>
  `).join('')}
  <div class="footer">
    <p>${language === 'ne' ? 'किसान साथी AI द्वारा उत्पन्न' : language === 'hi' ? 'किसान साथी AI द्वारा उत्पन्न' : 'Generated by Kisan Sathi AI'}</p>
  </div>
</body>
</html>`;

      // Use download link instead of window.open to avoid popup blocker
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farmer-gpt-chat-${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: language === 'ne' ? 'डाउनलोड भयो' : language === 'hi' ? 'डाउनलोड हुआ' : 'Downloaded',
        description: language === 'ne' ? 'HTML फाइल डाउनलोड भयो। ब्राउजरमा खोलेर Print → PDF गर्नुहोस्।' : language === 'hi' ? 'HTML फाइल डाउनलोड हुई। ब्राउज़र में खोलकर Print → PDF करें।' : 'HTML file downloaded. Open in browser and Print → Save as PDF.',
      });
    } catch (error) {
      console.error('Report error:', error);
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: language === 'ne' ? 'डाउनलोड गर्न सकिएन' : 'Failed to download',
        variant: 'destructive'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle loading session from history
  const handleLoadSession = (loadedMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date; imageUrl?: string }>) => {
    setMessages(loadedMessages as Message[]);
    toast({
      title: language === 'ne' ? 'कुराकानी लोड भयो' : language === 'hi' ? 'बातचीत लोड हुई' : 'Conversation Loaded',
      description: language === 'ne' ? `${loadedMessages.length} सन्देशहरू` : `${loadedMessages.length} messages`,
    });
  };

  // If embedded full screen mode, render directly without floating button
  if (isEmbeddedFullScreen) {
    return (
      <>
        <div className="flex flex-col h-full bg-background">
          {/* ========== HEADER — slim, farmer-friendly ========== */}
          <div className="sticky top-0 z-20 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-md">
            <div className="max-w-3xl mx-auto flex items-center justify-between px-4 h-12 sm:h-14">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-bold text-[15px] text-foreground leading-none tracking-tight">
                      {language === 'ne' ? 'कृषि मित्र' : 'Krishi Mitra'}
                    </h1>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {language === 'ne' ? 'तपाईंको कृषि सहायक' : 'Your farming assistant'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {!isOnline && (
                  <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-1 rounded-md flex items-center gap-1 mr-1">
                    <WifiOff className="w-3 h-3" />
                  </span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
                      <Globe className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    {languageOptions.map((lang) => (
                      <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code as 'ne' | 'hi' | 'en')}
                        className={cn("cursor-pointer", assistantLang === lang.code && "bg-primary/10 text-primary")}>
                        <span className="mr-2">{lang.flag}</span><span>{lang.label}</span>
                        {assistantLang === lang.code && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => setShowVoiceCall(true)}>
                  <Mic className="w-4 h-4" />
                </Button>
                {profile && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" onClick={() => setShowChatHistory(true)}>
                    <History className="w-4 h-4" />
                  </Button>
                )}
                {messages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={downloadReport} disabled={isExportingPdf}>
                        <FileDown className="w-4 h-4 mr-2" />
                        {language === 'ne' ? 'डाउनलोड' : 'Export chat'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={clearChat} className="text-destructive">
                        <X className="w-4 h-4 mr-2" />
                        {language === 'ne' ? 'मेटाउनुहोस्' : 'Clear chat'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* ========== MESSAGES AREA ========== */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              /* ========== EMPTY STATE — farmer-first welcome ========== */
              <div className="flex flex-col h-full px-4 sm:px-6">
                <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
                  {/* Compact greeting */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Leaf className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {language === 'ne' ? 'नमस्ते 🙏' : language === 'hi' ? 'नमस्ते 🙏' : 'Namaste 🙏'}
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      {language === 'ne' 
                        ? 'म किसान साथी AI हुँ। खेतीको बारेमा सोध्नुहोस्।' 
                        : language === 'hi' 
                        ? 'मैं किसान साथी AI हूँ। खेती के बारे में पूछें।'
                        : "I'm Kisan Sathi AI. Ask me about farming."}
                    </p>
                  </motion.div>

                  {/* Farmer-first suggestion chips — bilingual */}
                  <div className="w-full grid grid-cols-2 gap-2 mb-5">
                    {quickQuestions[getQuickQuestionsLang()].map((q, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + idx * 0.04 }}
                        onClick={() => {
                          if ('isPhotoAction' in q && q.isPhotoAction) {
                            imageInputRef.current?.click();
                          } else {
                            handleSendMessage(q.text);
                          }
                        }}
                        disabled={isLoading}
                        className={cn(
                          "flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-card",
                          "hover:border-primary/30 hover:bg-primary/[0.03] transition-all text-left",
                          "touch-manipulation active:scale-[0.97]"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                          <q.icon className={cn("w-4 h-4", q.color)} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[13px] font-medium text-foreground leading-tight block">{q.text}</span>
                          {'subtext' in q && (
                            <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">{q.subtext}</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Hero "Talk to AI" voice CTA */}
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl w-full max-w-sm mx-auto",
                      "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground",
                      "shadow-lg hover:shadow-xl active:scale-[0.97] transition-all touch-manipulation",
                      isListening && "from-destructive to-destructive/85"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      "bg-white/20 backdrop-blur-sm"
                    )}>
                      {isListening ? (
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                          <MicOff className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-[15px] font-bold block">
                        {isListening 
                          ? (language === 'ne' ? 'सुन्दैछु... बोल्नुहोस्' : 'Listening... speak now')
                          : (language === 'ne' ? '🎤 AI सँग बोल्नुहोस्' : '🎤 Talk to AI')}
                      </span>
                      <span className="text-[12px] opacity-85 block mt-0.5">
                        {isListening 
                          ? (language === 'ne' ? 'बोलिसक्दा फेरि थिच्नुहोस्' : 'Tap again when done')
                          : (language === 'ne' ? 'नेपाली वा English मा बोल्नुहोस्' : 'Speak in Nepali or English')}
                      </span>
                    </div>
                  </motion.button>

                </div>
              </div>
            ) : (
              /* ========== CHAT MESSAGES ========== */
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-3">
                {messages.map((msg, i) => {
                  if (msg.diseaseResult) {
                    const userMsgWithImage = messages.slice(0, i).reverse().find(m => m.role === 'user' && m.imageUrl);
                    const imageUrl = userMsgWithImage?.imageUrl || '';
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%]">
                        <DiseaseDetectionResult 
                          result={msg.diseaseResult} language={language}
                          onSpeak={ttsSupported ? (text) => speak(text) : undefined} isSpeaking={isSpeaking}
                          onSave={profile ? () => handleSaveDiseaseResult(i, imageUrl, msg.diseaseResult!) : undefined}
                          isSaved={msg.isSaved} imageUrl={imageUrl}
                        />
                      </motion.div>
                    );
                  }

                  if (msg.isAnalyzing) {
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Leaf className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2.5">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          <span className="text-[13px] text-muted-foreground">
                            {language === 'ne' ? 'फोटो हेर्दैछु...' : language === 'hi' ? 'फोटो देख रहा हूँ...' : 'Analyzing photo...'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  }

                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Leaf className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] sm:max-w-[75%]",
                        isUser 
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2.5" 
                          : "bg-card border border-border/40 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm"
                      )}>
                        {msg.role === 'user' && msg.isOffline && (
                          <div className="flex items-center gap-1 mb-1 text-[10px] opacity-70">
                            <WifiOff className="w-3 h-3" /><span>Queued</span>
                          </div>
                        )}
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden">
                            <img src={msg.imageUrl} alt="Crop photo" className="max-w-full max-h-40 object-contain rounded-lg" />
                          </div>
                        )}
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed text-[14px]">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground text-[14px]">{msg.content}</p>
                          </div>
                        )}
                        {msg.isOffline && !isUser && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                            <WifiOff className="w-3 h-3" />
                            <span>{language === 'ne' ? 'अफलाइन' : 'Offline'}</span>
                          </div>
                        )}
                        {!isUser && ttsSupported && !msg.diseaseResult && (
                          <button
                            className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => isSpeaking ? stop() : speak(msg.content)}
                          >
                            {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            {isSpeaking ? (language === 'ne' ? 'रोक्नुहोस्' : 'Stop') : (language === 'ne' ? 'सुन्नुहोस्' : 'Listen')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Typing indicator */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Leaf className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-card border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ========== INPUT AREA — fixed bottom, premium feel ========== */}
          <div className="shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/30">
            <div className="max-w-3xl mx-auto px-3 sm:px-5 pt-2 pb-5 sm:pb-6 space-y-2">
              {/* Selected image preview */}
              {selectedImage && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block">
                  <img src={selectedImage} alt="Selected" className="max-h-16 rounded-lg border border-border shadow-sm" />
                  <button onClick={removeSelectedImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-2 bg-muted/30 border border-border/50 rounded-2xl px-2 py-1.5 transition-all focus-within:border-primary/30 focus-within:shadow-sm">
                <input ref={imageInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                
                <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isLoading || !!selectedImage}
                  className="shrink-0 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground touch-manipulation"
                  title={language === 'ne' ? 'फोटो' : 'Photo'}>
                  <ImagePlus className="w-[18px] h-[18px]" />
                </Button>

                <Button variant={isListening ? "destructive" : "ghost"} size="icon" onClick={toggleListening} disabled={isLoading}
                  className={cn("shrink-0 h-9 w-9 rounded-lg touch-manipulation", !isListening && "text-muted-foreground hover:text-foreground")}>
                  {isListening ? (
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}>
                      <MicOff className="w-[18px] h-[18px]" />
                    </motion.div>
                  ) : (
                    <Mic className="w-[18px] h-[18px]" />
                  )}
                </Button>

                <Input
                  ref={inputRefToUse as RefObject<HTMLInputElement>}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening 
                      ? (language === 'ne' ? 'सुन्दैछु...' : 'Listening...')
                      : (language === 'ne' ? 'खेतीको बारेमा सोध्नुहोस्...' : 'Ask about farming...')
                  }
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className="flex-1 h-9 text-[14px] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />

                <Button onClick={() => handleSendMessage()} disabled={(!inputText.trim() && !selectedImage) || isLoading} size="icon"
                  className="shrink-0 h-9 w-9 rounded-lg touch-manipulation">
                  {isLoading ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                </Button>
              </div>

              {/* Listening indicator + subtle sub info */}
              <div className="flex items-center justify-between px-1">
                {isListening ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-[11px] text-destructive font-medium">{language === 'ne' ? 'बोल्नुहोस्...' : 'Speak now...'}</span>
                  </motion.div>
                ) : <div />}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <SubscriptionModal isOpen={showSubscriptionModal} onClose={() => setShowSubscriptionModal(false)} queriesUsed={queries_used} queriesLimit={queries_limit} />

        {profile && (
          <ChatHistoryModal isOpen={showChatHistory} onClose={() => setShowChatHistory(false)} farmerId={profile.id} language={assistantLang as 'ne' | 'hi' | 'en'} onLoadSession={handleLoadSession} />
        )}

        <AnimatePresence>
          {showVoiceCall && (
            <VoiceFarmingAssistant
              language={assistantLang as 'ne' | 'hi' | 'en'}
              onClose={() => setShowVoiceCall(false)}
              onSendMessage={(question, aiResp) => {
                const userMsg: Message = { role: 'user', content: question, timestamp: new Date() };
                const assistantMsg: Message = { role: 'assistant', content: aiResp, timestamp: new Date() };
                setMessages(prev => [...prev, userMsg, assistantMsg]);
                saveMessageToDb('user', question);
                saveMessageToDb('assistant', aiResp);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOfflinePremiumPrompt && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowOfflinePremiumPrompt(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card rounded-2xl p-6 text-center shadow-xl">
                <Crown className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">{language === 'ne' ? 'अफलाइन आवाज सीमा पुग्यो' : 'Offline Voice Limit Reached'}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ne' ? 'तपाईंले ३ वटा निःशुल्क अफलाइन आवाज प्रयोग गर्नुभयो। असीमित आवाजको लागि प्रीमियम लिनुहोस्।' : 'You have used 3 free offline voice responses. Get premium for unlimited voice.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowOfflinePremiumPrompt(false)}>{language === 'ne' ? 'पछि' : 'Later'}</Button>
                  <Button className="flex-1" onClick={() => { setShowOfflinePremiumPrompt(false); setShowSubscriptionModal(true); }}>
                    <Crown className="w-4 h-4 mr-1" />{language === 'ne' ? 'प्रीमियम' : 'Premium'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDiseaseUpload && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDiseaseUpload(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
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
      : "bottom-14 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 md:w-[420px] rounded-2xl max-h-[85vh] sm:max-h-[75vh]"
  );

  return (
    <>
      {/* Floating Button - Hidden on Krishi Mitra page and in embedded full screen mode */}
      {!isKrishiMitraPage && !isEmbeddedFullScreen && (
        <motion.div
          className="fixed bottom-12 right-4 sm:bottom-14 sm:right-6 z-50"
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
