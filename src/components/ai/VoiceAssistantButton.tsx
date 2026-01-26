import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, X, MessageSquare, Send, Download, Crown, Camera } from 'lucide-react';
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

export function VoiceAssistantButton() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPanel, setShowPanel] = useState(false);
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
  
  const { can_query, queries_used, queries_limit, subscribed, plan, incrementQueryCount, loading: subLoading } = useSubscription();

  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech({
    language,
    rate: 0.9,
    pitch: 1
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ne' ? 'ne-NP' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setInputText(transcript);
        
        if (event.results[0].isFinal) {
          setIsListening(false);
          // Auto-send after final result
          if (transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast({
            title: language === 'ne' ? 'माइक्रोफोन अनुमति छैन' : 'Microphone not allowed',
            description: language === 'ne' ? 'कृपया टाइप गर्नुहोस्' : 'Please type your message instead',
            variant: 'destructive'
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: language === 'ne' ? 'भ्वाइस समर्थित छैन' : 'Voice not supported',
        description: language === 'ne' ? 'कृपया टाइप गर्नुहोस्' : 'Please type your message',
        variant: 'destructive'
      });
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
        toast({
          title: language === 'ne' ? 'भ्वाइस सुरु भएन' : 'Voice failed to start',
          description: language === 'ne' ? 'कृपया टाइप गर्नुहोस्' : 'Please type your message',
          variant: 'destructive'
        });
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
      // Call AI assistant
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

      // Parse streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

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

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: fullResponse || (language === 'ne' ? 'माफ गर्नुहोस्, जवाफ प्राप्त भएन।' : 'Sorry, no response received.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Auto-speak the response
      if (autoSpeak && ttsSupported && fullResponse) {
        speak(fullResponse);
      }

    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: language === 'ne' ? 'जवाफ प्राप्त गर्न सकिएन' : 'Failed to get response',
        variant: 'destructive'
      });
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
  };

  const clearChat = () => {
    setMessages([]);
    stop();
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
      toast({
        title: language === 'ne' ? 'रिपोर्ट त्रुटि' : 'Report error',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <Button
          onClick={() => setShowPanel(!showPanel)}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-lg",
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
              <Volume2 className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl w-80 sm:w-96 max-h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="font-semibold text-sm">
                  {language === 'ne' ? '🌾 किसान साथी' : '🌾 Kisan Saathi'}
                </span>
                {subscribed && (
                  <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {plan === 'monthly' ? (language === 'ne' ? 'मासिक' : 'Monthly') : (language === 'ne' ? 'वार्षिक' : 'Yearly')}
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[350px]">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <div className="text-3xl mb-2">🌾</div>
                  <p className="font-medium text-foreground mb-1">
                    {language === 'ne' ? 'नमस्ते दाइ/दिदी!' : 'Namaste!'}
                  </p>
                  <p className="text-xs">
                    {language === 'ne' 
                      ? 'म तपाईंको किसान साथी। कृषि सम्बन्धी कुनै पनि प्रश्न सोध्नुहोस्!' 
                      : "I'm your Kisan Saathi. Ask any farming question!"}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
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
                      "rounded-lg p-3 text-sm max-w-[85%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted mr-auto"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && ttsSupported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 px-2 text-xs"
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
                  className="bg-muted rounded-lg p-3 mr-auto"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'ne' ? 'सोच्दैछ...' : 'Thinking...'}
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex gap-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <MicOff className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={language === 'ne' ? 'सोध्नुहोस्...' : 'Ask something...'}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading || isListening}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
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
            <div className="px-4 pb-3 space-y-2">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDiseaseUpload(true)}
                  className="flex-1 text-xs"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {language === 'ne' ? 'रोग पहिचान' : 'Disease Check'}
                </Button>
                {messages.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadReport}
                    className="flex-1 text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {language === 'ne' ? 'रिपोर्ट' : 'Report'}
                  </Button>
                )}
              </div>
              
              {/* Subscription CTA for free users */}
              {!subscribed && !subLoading && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-full text-xs bg-accent/10 hover:bg-accent/20 text-accent"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  {language === 'ne' ? 'असीमित सल्लाहका लागि सदस्यता लिनुहोस्' : 'Subscribe for unlimited advice'}
                </Button>
              )}
              
              {messages.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  className="w-full text-xs text-muted-foreground"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
