import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Leaf, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { supabase } from '@/integrations/supabase/client';

type VoicePhase = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceFarmingAssistantProps {
  language: 'ne' | 'hi' | 'en';
  onClose: () => void;
  onSendMessage?: (text: string, aiResponse: string) => void;
}

const phaseLabels: Record<VoicePhase, Record<string, string>> = {
  idle: { ne: 'बोल्न ट्याप गर्नुहोस्', en: 'Tap to speak' },
  listening: { ne: 'सुन्दैछु... बोल्नुहोस्', en: 'Listening... speak now' },
  processing: { ne: 'सोचिरहेको छ...', en: 'Thinking...' },
  speaking: { ne: 'जवाफ सुन्नुहोस्...', en: 'Listen to the answer...' },
};

const welcomeText: Record<string, string> = {
  ne: 'नमस्ते! म किसान साथी AI हुँ।\nतपाईंको खेती सम्बन्धी प्रश्न सोध्नुहोस्।',
  en: "Namaste! I am Kisan Sathi AI.\nAsk me any farming question.",
};

const errorText: Record<string, string> = {
  ne: 'माफ गर्नुहोस्, तपाईंको आवाज स्पष्ट बुझ्न सकिन।\nफेरि प्रयास गर्नुहोस्।',
  en: "Sorry, I couldn't understand clearly.\nPlease try again.",
};

export function VoiceFarmingAssistant({ language, onClose, onSendMessage }: VoiceFarmingAssistantProps) {
  const lang = language === 'ne' ? 'ne' : 'en';
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [voiceOnly, setVoiceOnly] = useState(true);

  const recognitionRef = useRef<any>(null);

  const { speak, stop: stopTts, isSpeaking } = useTextToSpeech({
    language: lang,
    rate: 1.1,
    onEnd: () => setPhase('idle'),
    onError: () => setPhase('idle'),
  });

  useEffect(() => {
    if (isSpeaking && phase === 'speaking') {}
  }, [isSpeaking, phase]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(text);
      if (event.results[0].isFinal && text.trim()) {
        handleUserQuestion(text.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Voice error:', event.error);
      if (event.error === 'no-speech') {
        setErrorMsg(errorText[lang]);
        setTimeout(() => setErrorMsg(''), 3000);
      }
      setPhase('idle');
    };

    recognition.onend = () => {
      if (phase === 'listening') {
        if (!transcript.trim()) {
          setPhase('idle');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setShowWelcome(false);
    setErrorMsg('');
    setTranscript('');
    setAiResponse('');
    stopTts();

    try {
      recognitionRef.current.lang = lang === 'ne' ? 'ne-NP' : 'en-US';
      recognitionRef.current.start();
      setPhase('listening');
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [lang, stopTts]);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const handleUserQuestion = useCallback(async (question: string) => {
    setPhase('processing');
    stopListening();

    try {
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
          messages: [{ role: 'user', content: question }],
          language: lang,
          hasImage: false,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      let fullResponse = '';
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                setAiResponse(fullResponse);
              }
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }
      }

      if (fullResponse) {
        setAiResponse(fullResponse);
        setPhase('speaking');
        speak(fullResponse);
        onSendMessage?.(question, fullResponse);
      } else {
        setErrorMsg(errorText[lang]);
        setTimeout(() => setErrorMsg(''), 3000);
        setPhase('idle');
      }
    } catch (error) {
      console.error('AI voice error:', error);
      setErrorMsg(errorText[lang]);
      setTimeout(() => setErrorMsg(''), 3000);
      setPhase('idle');
    }
  }, [lang, speak, stopListening, onSendMessage]);

  const handleMicTap = () => {
    if (phase === 'listening') {
      stopListening();
      if (transcript.trim()) {
        handleUserQuestion(transcript.trim());
      } else {
        setPhase('idle');
      }
    } else if (phase === 'speaking') {
      stopTts();
      setPhase('idle');
    } else if (phase === 'idle') {
      startListening();
    }
  };

  const handleReplay = () => {
    if (aiResponse) {
      setPhase('speaking');
      speak(aiResponse);
    }
  };

  const micColors: Record<VoicePhase, string> = {
    idle: 'bg-primary hover:bg-primary/90',
    listening: 'bg-destructive hover:bg-destructive/90',
    processing: 'bg-accent hover:bg-accent/90',
    speaking: 'bg-primary hover:bg-primary/90',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-background"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">
              {lang === 'ne' ? 'आवाज सहायक' : 'Voice Assistant'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {voiceOnly
                ? (lang === 'ne' ? 'आवाज मात्र मोड' : 'Voice-only mode')
                : (lang === 'ne' ? 'बोलेर सोध्नुहोस्' : 'Ask by speaking')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceOnly(!voiceOnly)}
            className="h-9 w-9 rounded-xl"
            title={voiceOnly
              ? (lang === 'ne' ? 'Text देखाउनुहोस्' : 'Show text')
              : (lang === 'ne' ? 'Text लुकाउनुहोस्' : 'Hide text')}
          >
            {voiceOnly ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 overflow-y-auto">

        {/* Welcome */}
        <AnimatePresence>
          {showWelcome && phase === 'idle' && !aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-w-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground text-base whitespace-pre-line leading-relaxed">
                {welcomeText[lang]}
              </p>
              {voiceOnly && (
                <p className="text-[11px] text-muted-foreground mt-3 px-4">
                  {lang === 'ne'
                    ? 'आवाज मात्र मोड: AI ले बोलेर जवाफ दिनेछ।'
                    : 'Voice-only mode: AI will answer by speaking.'}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase label */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-semibold shadow-sm",
            phase === 'listening' && "bg-destructive/10 text-destructive",
            phase === 'processing' && "bg-accent/20 text-accent-foreground",
            phase === 'speaking' && "bg-primary/10 text-primary",
            phase === 'idle' && "bg-muted text-muted-foreground",
          )}
        >
          {phaseLabels[phase][lang]}
        </motion.div>

        {/* Mic button */}
        <div className="relative">
          <AnimatePresence>
            {phase === 'listening' && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-destructive/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-destructive/20"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </>
            )}
            {phase === 'speaking' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/15"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleMicTap}
            disabled={phase === 'processing'}
            className={cn(
              "relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-colors shadow-xl touch-manipulation",
              micColors[phase],
            )}
          >
            {phase === 'processing' ? (
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-accent-foreground animate-spin" />
            ) : phase === 'listening' ? (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                <MicOff className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </motion.div>
            ) : phase === 'speaking' ? (
              <Volume2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
            ) : (
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
            )}
          </motion.button>
        </div>

        {/* Voice-only mode: minimal status indicators */}
        {voiceOnly ? (
          <>
            <AnimatePresence>
              {transcript && (phase === 'listening' || phase === 'processing') && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <Mic className="w-3 h-3" />
                  {lang === 'ne' ? 'तपाईंले बोल्नुभयो ✓' : 'You spoke ✓'}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {aiResponse && (phase === 'speaking' || phase === 'idle') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Leaf className="w-3 h-3 text-primary" />
                    {phase === 'speaking'
                      ? (lang === 'ne' ? 'AI बोल्दैछ...' : 'AI is speaking...')
                      : (lang === 'ne' ? 'AI ले जवाफ दियो ✓' : 'AI answered ✓')}
                  </p>
                  {phase === 'idle' && (
                    <div className="flex items-center gap-3">
                      <button onClick={handleReplay} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                        <Volume2 className="w-3.5 h-3.5" />
                        {lang === 'ne' ? 'फेरि सुन्नुहोस्' : 'Replay'}
                      </button>
                      <button onClick={() => setVoiceOnly(false)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        {lang === 'ne' ? 'Text हेर्नुहोस्' : 'Show text'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Full text mode */}
            <AnimatePresence>
              {transcript && (phase === 'listening' || phase === 'processing') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full max-w-md"
                >
                  <div className="bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Mic className="w-3 h-3" />
                      {lang === 'ne' ? 'तपाईंले भन्नुभयो:' : 'You said:'}
                    </p>
                    <p className="text-foreground text-base leading-relaxed">{transcript}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {aiResponse && (phase === 'speaking' || phase === 'idle') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-md"
                >
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                        <Leaf className="w-3 h-3" />
                        {lang === 'ne' ? 'किसान साथीको जवाफ:' : "Kisan Sathi's answer:"}
                      </p>
                      {phase === 'idle' && (
                        <button onClick={handleReplay} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                          <Volume2 className="w-3 h-3" />
                          {lang === 'ne' ? 'फेरि सुन्नुहोस्' : 'Replay'}
                        </button>
                      )}
                    </div>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
                      {aiResponse}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Error message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-destructive/10 border border-destructive/20 rounded-2xl px-5 py-3 max-w-md w-full"
            >
              <p className="text-destructive text-sm text-center whitespace-pre-line">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-4 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          {lang === 'ne' ? 'नेपाली वा English मा बोल्नुहोस्' : 'Speak in Nepali or English'}
        </p>
      </div>
    </motion.div>
  );
}