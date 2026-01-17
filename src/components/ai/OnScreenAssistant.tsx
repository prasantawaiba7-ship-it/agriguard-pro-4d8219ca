import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Volume2, VolumeX, Loader2, X, MessageSquare, 
  Send, Download, Crown, Camera, RefreshCw, Minimize2, Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { DiseaseImageUpload } from '@/components/ai/DiseaseImageUpload';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function OnScreenAssistant() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPanel, setShowPanel] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDiseaseUpload, setShowDiseaseUpload] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Initialize speech recognition with error handling
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ne' ? 'ne-NP' : 'en-US';

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
  }, [language]);

  // Friendly error messages
  const showFriendlyError = useCallback((errorType: string) => {
    const messages: Record<string, { ne: string; en: string }> = {
      mic_permission: {
        ne: 'माइक्रोफोन अनुमति छैन। कृपया टाइप गर्नुहोस्।',
        en: 'Microphone not allowed. Please type instead.'
      },
      network: {
        ne: 'माफ गर्नुहोस्, जडानमा समस्या आयो। फेरि प्रयास गरौँ।',
        en: 'Connection issue. Please try again.'
      },
      no_speech: {
        ne: 'आवाज सुनिएन। कृपया फेरि बोल्नुहोस्।',
        en: "Didn't hear you. Please speak again."
      },
      api_error: {
        ne: 'माफ गर्नुहोस्, जवाफ प्राप्त गर्न सकिएन। फेरि प्रयास गर्नुहोस्।',
        en: 'Could not get response. Please try again.'
      }
    };

    const msg = messages[errorType] || messages.api_error;
    toast({
      title: language === 'ne' ? 'समस्या' : 'Issue',
      description: language === 'ne' ? msg.ne : msg.en,
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
    if (!messageText || isLoading) return;

    // Check subscription
    if (!can_query && !subscribed) {
      setShowSubscriptionModal(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Increment query count for free users
    if (!subscribed) {
      await incrementQueryCount();
    }

    try {
      const response = await supabase.functions.invoke('ai-farm-assistant', {
        body: {
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: messageText }
          ],
          language
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
        content: fullResponse || (language === 'ne' ? 'माफ गर्नुहोस्, जवाफ प्राप्त भएन।' : 'Sorry, no response received.'),
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

  // Panel classes based on screen size and fullscreen mode
  const panelClasses = cn(
    "fixed z-50 bg-card border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
    isFullScreen 
      ? "inset-0 rounded-none" // Full screen on mobile
      : "bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 md:w-[420px] rounded-2xl max-h-[85vh] sm:max-h-[75vh]"
  );

  return (
    <>
      {/* Floating Button - Always visible */}
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
                {!subscribed && (
                  <span className="text-xs text-muted-foreground mr-1">
                    {queries_used}/{queries_limit}
                  </span>
                )}
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
                <div className="text-center text-muted-foreground text-sm py-8">
                  <div className="text-4xl sm:text-5xl mb-3">🌾</div>
                  <p className="font-medium text-foreground text-base sm:text-lg mb-1">
                    {language === 'ne' ? 'नमस्ते दाइ/दिदी!' : 'Namaste!'}
                  </p>
                  <p className="text-xs sm:text-sm max-w-[250px] mx-auto">
                    {language === 'ne' 
                      ? 'म तपाईंको कृषि मित्र। कृषि सम्बन्धी कुनै पनि प्रश्न सोध्नुहोस्!' 
                      : "I'm your Krishi Mitra. Ask any farming question!"}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Mic className="w-4 h-4" />
                    <span>{language === 'ne' ? 'बोल्नुहोस् वा टाइप गर्नुहोस्' : 'Speak or type'}</span>
                  </div>
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
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
              <div className="flex gap-2">
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
                  placeholder={language === 'ne' ? 'सोध्नुहोस्...' : 'Ask something...'}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
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
              
              {/* Subscription CTA for free users */}
              {!subscribed && !subLoading && (
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
