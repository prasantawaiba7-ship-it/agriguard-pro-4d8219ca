import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, RefreshCw, Settings, Phone, PhoneOff, Repeat, WifiOff, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useLanguage } from '@/hooks/useLanguage';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DeviceConfig {
  ttsVolume: number;
  ttsRate: number;
  defaultLanguage: string;
  autoPlayResponse: boolean;
  showTranscript: boolean;
  kioskMode: boolean;
}

const defaultConfig: DeviceConfig = {
  ttsVolume: 1,
  ttsRate: 0.9,
  defaultLanguage: 'ne',
  autoPlayResponse: true,
  showTranscript: true,
  kioskMode: false,
};

const stateLabels = {
  idle: {
    ne: 'बोल्न ट्याप गर्नुहोस्',
    en: 'Tap to speak'
  },
  listening: {
    ne: 'सुनिरहेको छ... बोल्नुहोस्',
    en: 'Listening... Speak now'
  },
  thinking: {
    ne: 'सोचिरहेको छ... पर्खनुहोस्',
    en: 'Thinking... Please wait'
  },
  speaking: {
    ne: 'जवाफ दिइरहेको छ... सुन्नुहोस्',
    en: 'Speaking... Listen'
  }
};

export default function KrishiMitraDevice() {
  const { language } = useLanguage();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(defaultConfig);
  const [showOfflineData, setShowOfflineData] = useState(false);
  
  const currentLang = language === 'ne' ? 'ne' : 'en';

  // Offline cache for crop recommendations and disease detections
  const { 
    cropRecommendations, 
    diseaseDetections, 
    isOnline, 
    hasOfflineData,
    refreshCache 
  } = useOfflineCache();

  // TTS hook for replay functionality
  const { speak, stop, isSpeaking: isTtsSpeaking } = useTextToSpeech({
    language: currentLang,
    rate: deviceConfig.ttsRate,
    onError: (error) => {
      toast.error(currentLang === 'ne' ? 'आवाज त्रुटि' : 'Voice error', { description: error });
    }
  });

  // Load device config from database
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'device_config')
          .single();
        if (data?.value) {
          setDeviceConfig({ ...defaultConfig, ...(data.value as object) });
        }
      } catch (e) {
        // Use defaults
      }
    };
    loadConfig();
  }, []);

  const {
    status,
    isSpeaking,
    transcript,
    aiResponseText,
    connect,
    disconnect,
    isConnected
  } = useRealtimeVoice({
    language: currentLang,
    onMessage: useCallback((message: { role: 'user' | 'assistant'; content: string }) => {
      setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
      if (message.role === 'assistant') {
        setVoiceState('idle');
      }
    }, []),
    onError: useCallback((error: string) => {
      toast.error(currentLang === 'ne' ? 'त्रुटि भयो' : 'Error occurred', {
        description: error
      });
      setVoiceState('idle');
    }, [currentLang]),
    onStatusChange: useCallback((newStatus: string) => {
      if (newStatus === 'speaking') {
        setVoiceState('speaking');
      } else if (newStatus === 'connected') {
        setVoiceState('listening');
      }
    }, []),
    onUserTranscript: useCallback((text: string, isFinal: boolean) => {
      setLiveTranscript(text);
      if (isFinal) {
        setVoiceState('thinking');
      }
    }, []),
    onAiTranscript: useCallback((text: string, isFinal: boolean) => {
      if (!isFinal) {
        setLiveTranscript(prev => prev + text);
      } else {
        setLiveTranscript('');
      }
    }, [])
  });

  // Update voice state based on connection status
  useEffect(() => {
    if (isSpeaking) {
      setVoiceState('speaking');
    } else if (status === 'connected') {
      setVoiceState('listening');
    } else if (status === 'connecting') {
      setVoiceState('thinking');
    } else {
      setVoiceState('idle');
    }
  }, [status, isSpeaking]);

  const handleToggleConnection = async () => {
    if (isConnected) {
      disconnect();
      setVoiceState('idle');
      setLiveTranscript('');
    } else {
      await connect();
    }
  };

  // Replay last AI answer with TTS
  const handleReplayAnswer = (text: string) => {
    if (isTtsSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];

  const getStateColor = () => {
    switch (voiceState) {
      case 'listening': return 'bg-success';
      case 'thinking': return 'bg-warning';
      case 'speaking': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex flex-col">
      {/* Header - minimal for device mode */}
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">🌾</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {currentLang === 'ne' ? 'कृषि मित्र' : 'Krishi Mitra'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentLang === 'ne' ? 'तपाईंको कृषि सहायक' : 'Your Farming Assistant'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="h-10 w-10"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          {hasOfflineData && (
            <Button
              variant={showOfflineData ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowOfflineData(!showOfflineData)}
              className="h-10 w-10"
            >
              <Database className="h-5 w-5" />
            </Button>
          )}
          {!deviceConfig.kioskMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/device/settings'}
              className="h-10 w-10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Offline Data Panel */}
      <AnimatePresence>
        {showOfflineData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/50 bg-card/50"
          >
            <div className="p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  {!isOnline && <WifiOff className="h-4 w-4 text-destructive" />}
                  {currentLang === 'ne' ? 'क्यास गरिएको डाटा' : 'Cached Data'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowOfflineData(false)}>
                  ✕
                </Button>
              </div>
              
              {/* Quick view of cached recommendations */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cropRecommendations.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{rec.plot_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {Array.isArray(rec.recommended_crops) 
                        ? rec.recommended_crops.map((c: any) => typeof c === 'object' ? c.name : c).join(', ')
                        : String(rec.recommended_crops)
                      }
                    </p>
                  </div>
                ))}
                {diseaseDetections.slice(0, 2).map((det) => (
                  <div key={det.id} className="bg-warning/10 rounded-lg p-3 text-sm">
                    <p className="font-medium">{det.detected_disease || (currentLang === 'ne' ? 'स्वस्थ' : 'Healthy')}</p>
                    <p className="text-muted-foreground text-xs">{det.severity || 'N/A'}</p>
                  </div>
                ))}
                {cropRecommendations.length === 0 && diseaseDetections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {currentLang === 'ne' ? 'कुनै क्यास गरिएको डाटा छैन' : 'No cached data available'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 gap-6 pt-20 pb-20">
        
        {/* Status Indicator */}
        <motion.div
          key={voiceState}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-6 py-3 rounded-full ${getStateColor()} text-white font-semibold text-lg md:text-xl shadow-lg`}
        >
          {stateLabels[voiceState][currentLang]}
        </motion.div>

        {/* Main Mic Button */}
        <motion.div
          className="relative"
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulse animation when listening */}
          <AnimatePresence>
            {voiceState === 'listening' && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-success/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-success/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
            
            {voiceState === 'speaking' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          <Button
            onClick={handleToggleConnection}
            disabled={status === 'connecting'}
            className={`
              relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full 
              transition-all duration-300 shadow-2xl
              ${isConnected 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
              }
            `}
          >
            {status === 'connecting' ? (
              <RefreshCw className="h-16 w-16 md:h-24 md:w-24 text-white animate-spin" />
            ) : isConnected ? (
              <PhoneOff className="h-16 w-16 md:h-24 md:w-24 text-white" />
            ) : (
              <Phone className="h-16 w-16 md:h-24 md:w-24 text-white" />
            )}
          </Button>
        </motion.div>

        {/* Live Transcript */}
        <AnimatePresence>
          {liveTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full max-w-2xl px-4"
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border shadow-lg">
                <p className="text-lg md:text-xl text-center text-foreground">
                  {liveTranscript}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Display */}
        <div className="w-full max-w-2xl space-y-4 px-4">
          {/* Last User Question */}
          {lastUserMessage && (
            <motion.div
              key={lastUserMessage.timestamp.toISOString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-muted/50 rounded-2xl p-4 md:p-6 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {currentLang === 'ne' ? 'तपाईंले सोध्नुभयो:' : 'You asked:'}
                </span>
              </div>
              <p className="text-lg md:text-xl text-foreground">
                {lastUserMessage.content}
              </p>
            </motion.div>
          )}

          {/* Last AI Answer */}
          {lastAiMessage && (
            <motion.div
              key={lastAiMessage.timestamp.toISOString()}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-primary/10 rounded-2xl p-4 md:p-6 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌾</span>
                  <span className="text-sm font-medium text-primary">
                    {currentLang === 'ne' ? 'कृषि मित्रको जवाफ:' : "Krishi Mitra's answer:"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReplayAnswer(lastAiMessage.content)}
                  className="text-primary hover:text-primary/80"
                >
                  {isTtsSpeaking ? (
                    <VolumeX className="h-4 w-4 mr-1" />
                  ) : (
                    <Repeat className="h-4 w-4 mr-1" />
                  )}
                  {isTtsSpeaking 
                    ? (currentLang === 'ne' ? 'रोक्नुहोस्' : 'Stop')
                    : (currentLang === 'ne' ? 'पुन: सुन्नुहोस्' : 'Replay')
                  }
                </Button>
              </div>
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                {lastAiMessage.content}
              </p>
            </motion.div>
          )}

          {/* AI Response Building (live) */}
          {aiResponseText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-primary/5 rounded-2xl p-4 md:p-6 border border-primary/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  🌾
                </motion.span>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentLang === 'ne' ? 'जवाफ दिइरहेको...' : 'Answering...'}
                </span>
              </div>
              <p className="text-lg md:text-xl text-foreground">
                {aiResponseText}
              </p>
            </motion.div>
          )}
        </div>

        {/* Empty State */}
        {messages.length === 0 && !isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4"
          >
            <p className="text-xl md:text-2xl text-muted-foreground mb-2">
              {currentLang === 'ne' 
                ? 'माथिको बटन थिचेर बोल्न सुरु गर्नुहोस्' 
                : 'Press the button above to start talking'}
            </p>
            <p className="text-base md:text-lg text-muted-foreground/70">
              {currentLang === 'ne' 
                ? 'कृषि सम्बन्धी कुनै पनि प्रश्न सोध्नुहोस्' 
                : 'Ask any farming-related question'}
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer - connection status */}
      <footer className="p-4 border-t border-border/50">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'
          }`} />
          <span>
            {currentLang === 'ne' 
              ? (isConnected ? 'जडान भयो' : 'जडान छैन')
              : (isConnected ? 'Connected' : 'Disconnected')
            }
          </span>
        </div>
      </footer>
    </div>
  );
}
