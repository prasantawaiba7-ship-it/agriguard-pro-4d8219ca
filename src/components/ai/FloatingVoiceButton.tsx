import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Loader2, Volume2, Mic, X, MessageSquare, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingVoiceButton() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [showPanel, setShowPanel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const {
    status,
    isSpeaking,
    transcript,
    aiResponseText,
    connect,
    disconnect,
    isConnected
  } = useRealtimeVoice({
    language,
    speed: voiceSpeed,
    onMessage: (msg) => {
      setMessages(prev => [...prev, { ...msg, timestamp: new Date() }]);
      if (msg.role === 'user') {
        setUserTranscript('');
      }
      if (msg.role === 'assistant') {
        setAiTranscript('');
      }
    },
    onError: (error) => {
      toast({
        title: language === 'ne' ? 'त्रुटि' : 'Error',
        description: error,
        variant: 'destructive'
      });
    },
    onStatusChange: (newStatus) => {
      if (newStatus === 'connected') {
        toast({
          title: language === 'ne' ? 'जोडियो!' : 'Connected!',
          description: language === 'ne' ? 'अब बोल्न सक्नुहुन्छ' : 'You can now speak',
        });
      }
    }
  });

  // Update live transcript
  useEffect(() => {
    if (transcript && status === 'connected') {
      setUserTranscript(transcript);
    }
  }, [transcript, status]);

  const handleToggle = async () => {
    if (isConnected) {
      disconnect();
      setShowPanel(false);
      setMessages([]);
      setUserTranscript('');
      setAiTranscript('');
    } else {
      setShowPanel(true);
      await connect();
    }
  };

  const handleClose = () => {
    if (isConnected) {
      disconnect();
    }
    setShowPanel(false);
    setMessages([]);
    setUserTranscript('');
    setAiTranscript('');
  };

  const statusText = {
    disconnected: language === 'ne' ? 'आवाज सहायता' : 'Voice Assistant',
    connecting: language === 'ne' ? 'जोड्दैछ...' : 'Connecting...',
    connected: language === 'ne' ? 'सुन्दैछ...' : 'Listening...',
    speaking: language === 'ne' ? 'बोल्दैछ...' : 'AI Speaking...'
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <Button
          onClick={() => isConnected ? setShowPanel(!showPanel) : handleToggle()}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-lg",
            isConnected 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
          )}
        >
          {status === 'connecting' ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
          ) : isConnected ? (
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {isSpeaking ? (
                <Volume2 className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Mic className="w-6 h-6 text-primary-foreground" />
              )}
            </motion.div>
          ) : (
            <Phone className="w-6 h-6 text-primary-foreground" />
          )}
        </Button>

        {/* Pulse animation when connected */}
        {isConnected && !showPanel && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      {/* Voice Chat Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-36 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl w-80 max-h-[70vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-success animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="font-medium text-sm">
                  {language === 'ne' ? 'कृषि मित्र' : 'Krishi Mitra'}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Status Indicator */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-16 h-16">
                  <motion.div
                    className={cn(
                      "w-full h-full rounded-full flex items-center justify-center",
                      isSpeaking 
                        ? 'bg-primary/20' 
                        : status === 'connected'
                        ? 'bg-success/20'
                        : status === 'connecting'
                        ? 'bg-warning/20'
                        : 'bg-muted'
                    )}
                    animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {isSpeaking ? (
                      <Volume2 className="w-7 h-7 text-primary" />
                    ) : status === 'connecting' ? (
                      <Loader2 className="w-7 h-7 text-warning animate-spin" />
                    ) : (
                      <Mic className={cn(
                        "w-7 h-7",
                        status === 'connected' ? 'text-success' : 'text-muted-foreground'
                      )} />
                    )}
                  </motion.div>
                  
                  {/* Pulse rings */}
                  {(isSpeaking || status === 'connected') && (
                    <>
                      <motion.div
                        className={cn(
                          "absolute inset-0 rounded-full border-2",
                          isSpeaking ? "border-primary/30" : "border-success/30"
                        )}
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    </>
                  )}
                </div>

                <p className="text-sm font-medium">{statusText[status]}</p>
              </div>

              {/* Live Transcription Display */}
              <AnimatePresence mode="wait">
                {(userTranscript || isSpeaking || aiResponseText) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {/* User speaking transcription */}
                    {userTranscript && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-primary/10 rounded-lg p-3 border-l-2 border-primary"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className="w-3 h-3 text-primary" />
                          <span className="text-[10px] font-medium text-primary uppercase">
                            {language === 'ne' ? 'तपाईं' : 'You'}
                          </span>
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                        </div>
                        <p className="text-sm text-foreground">{userTranscript}</p>
                      </motion.div>
                    )}

                    {/* AI speaking with live transcription */}
                    {(isSpeaking || aiResponseText) && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-accent/10 rounded-lg p-3 border-l-2 border-accent"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="w-3 h-3 text-accent" />
                          <span className="text-[10px] font-medium text-accent uppercase">
                            {language === 'ne' ? 'कृषि मित्र' : 'Krishi Mitra'}
                          </span>
                          {isSpeaking && (
                            <div className="flex gap-0.5">
                              {[0, 1, 2].map(i => (
                                <motion.div
                                  key={i}
                                  className="w-1 h-3 bg-accent rounded-full"
                                  animate={{ scaleY: [0.3, 1, 0.3] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {aiResponseText && (
                          <p className="text-sm text-foreground">{aiResponseText}</p>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recent Messages */}
              {messages.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    <span>{language === 'ne' ? 'हालैका कुराहरू' : 'Recent'}</span>
                  </div>
                  {messages.slice(-3).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "text-xs p-2 rounded-lg",
                        msg.role === 'user' 
                          ? "bg-muted ml-4" 
                          : "bg-primary/5 mr-4"
                      )}
                    >
                      <p className="line-clamp-2">{msg.content}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Voice Speed Control */}
              {!isConnected && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSpeedControl(!showSpeedControl)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <Gauge className="w-3 h-3" />
                    <span>{language === 'ne' ? 'आवाज गति' : 'Voice Speed'}</span>
                    <span className="ml-auto text-primary font-medium">
                      {voiceSpeed === 1.0 ? (language === 'ne' ? 'सामान्य' : 'Normal') : 
                       voiceSpeed < 1.0 ? (language === 'ne' ? 'ढिलो' : 'Slow') : 
                       (language === 'ne' ? 'छिटो' : 'Fast')}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {showSpeedControl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                          <span>{language === 'ne' ? 'ढिलो' : 'Slow'}</span>
                          <span>{language === 'ne' ? 'छिटो' : 'Fast'}</span>
                        </div>
                        <Slider
                          value={[voiceSpeed]}
                          onValueChange={(value) => setVoiceSpeed(value[0])}
                          min={0.7}
                          max={1.2}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-center gap-2">
                          {[0.8, 1.0, 1.1].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => setVoiceSpeed(speed)}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] border transition-colors",
                                voiceSpeed === speed 
                                  ? "bg-primary text-primary-foreground border-primary" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {speed === 0.8 ? (language === 'ne' ? 'ढिलो' : 'Slow') : 
                               speed === 1.0 ? (language === 'ne' ? 'सामान्य' : 'Normal') : 
                               (language === 'ne' ? 'छिटो' : 'Fast')}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button
                    onClick={handleToggle}
                    disabled={status === 'connecting'}
                    className="w-full"
                  >
                    {status === 'connecting' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4 mr-2" />
                    )}
                    {language === 'ne' ? 'कुरा सुरु गर्नुहोस्' : 'Start Talking'}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleClose}
                    className="w-full"
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    {language === 'ne' ? 'बन्द गर्नुहोस्' : 'End Call'}
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <p className="text-[10px] text-center text-muted-foreground">
                {language === 'ne' 
                  ? 'नेपाली वा अंग्रेजीमा बोल्नुहोस्'
                  : 'Speak in Nepali or English'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
