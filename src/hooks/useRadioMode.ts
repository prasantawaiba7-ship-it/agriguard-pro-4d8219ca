import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RadioModeConfig {
  crop: string;
  stage: string;
  location?: string;
}

interface UseRadioModeOptions {
  intervalSeconds?: number;
  language?: string;
}

const RADIO_TIP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/radio-tip`;

export function useRadioMode(options: UseRadioModeOptions = {}) {
  const { intervalSeconds = 45, language = 'ne' } = options;
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [tipCount, setTipCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const configRef = useRef<RadioModeConfig | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const tipQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);

  // Fetch a single tip from the edge function
  const fetchTip = useCallback(async (): Promise<string | null> => {
    if (!configRef.current) return null;

    try {
      setIsFetching(true);
      const response = await fetch(RADIO_TIP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(configRef.current),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.textTip || null;
    } catch (err) {
      console.error('[RadioMode] Fetch error:', err);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Speak a tip using browser SpeechSynthesis
  const speakTip = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Try to find a Nepali/Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const nepaliVoice = voices.find(v =>
      v.lang.includes('ne') || v.name.toLowerCase().includes('nepali')
    );
    const hindiVoice = voices.find(v =>
      v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
    );
    if (nepaliVoice) utterance.voice = nepaliVoice;
    else if (hindiVoice) utterance.voice = hindiVoice;

    utterance.lang = 'ne-NP';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      // Play next queued tip if any
      if (tipQueueRef.current.length > 0 && isPlayingRef.current) {
        const next = tipQueueRef.current.shift()!;
        setCurrentTip(next);
        speakTip(next);
      }
    };

    utterance.onerror = (event) => {
      console.error('[RadioMode] TTS error:', event.error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Fetch and queue a new tip
  const fetchAndPlay = useCallback(async () => {
    if (!isPlayingRef.current) return;

    const tip = await fetchTip();
    if (!tip || !isPlayingRef.current) return;

    setTipCount(c => c + 1);

    // If currently speaking, queue; otherwise play immediately
    if (isSpeakingRef.current) {
      tipQueueRef.current.push(tip);
    } else {
      setCurrentTip(tip);
      speakTip(tip);
    }
  }, [fetchTip, speakTip]);

  // Start radio mode
  const start = useCallback((config: RadioModeConfig) => {
    configRef.current = config;
    isPlayingRef.current = true;
    tipQueueRef.current = [];
    setIsPlaying(true);
    setTipCount(0);
    setCurrentTip('');

    // Fetch first tip immediately
    fetchAndPlay();

    // Then fetch periodically
    intervalRef.current = setInterval(() => {
      fetchAndPlay();
    }, intervalSeconds * 1000);
  }, [fetchAndPlay, intervalSeconds]);

  // Stop radio mode
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    tipQueueRef.current = [];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isPlaying,
    currentTip,
    tipCount,
    isFetching,
    isSpeaking,
    start,
    stop,
  };
}
