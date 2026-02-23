import { useState, useCallback, useRef, useEffect } from 'react';
import { saveTip, loadCachedTips, getCachedTipCount, type RadioTip } from '@/lib/radioCache';

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
  const { intervalSeconds = 45 } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [tipCount, setTipCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedCount, setCachedCount] = useState(getCachedTipCount());

  const configRef = useRef<RadioModeConfig | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  const tipQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const offlineIndexRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => {
      setIsOnline(false);
      // If playing online, stop interval - will switch to cache
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

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
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data.textTip || null;

      // Cache the tip
      if (text && configRef.current) {
        saveTip({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          crop: configRef.current.crop,
          stage: configRef.current.stage,
          location: configRef.current.location,
          text,
        });
        setCachedCount(getCachedTipCount());
      }
      return text;
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

    const voices = window.speechSynthesis.getVoices();
    const nepaliVoice = voices.find(v => v.lang.includes('ne') || v.name.toLowerCase().includes('nepali'));
    const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (nepaliVoice) utterance.voice = nepaliVoice;
    else if (hindiVoice) utterance.voice = hindiVoice;

    utterance.lang = 'ne-NP';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => { isSpeakingRef.current = true; setIsSpeaking(true); };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
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

  // Play next cached tip (offline mode)
  const playNextCachedTip = useCallback(() => {
    if (!isPlayingRef.current) return;
    const tips = loadCachedTips();
    if (tips.length === 0 || offlineIndexRef.current >= tips.length) {
      // All cached tips exhausted
      stop();
      return 'exhausted';
    }
    const tip = tips[tips.length - 1 - offlineIndexRef.current]; // newest first
    offlineIndexRef.current++;
    setTipCount(c => c + 1);

    if (isSpeakingRef.current) {
      tipQueueRef.current.push(tip.text);
    } else {
      setCurrentTip(tip.text);
      speakTip(tip.text);
    }
    return 'ok';
  }, [speakTip]);

  // Fetch and queue a new tip (online)
  const fetchAndPlay = useCallback(async () => {
    if (!isPlayingRef.current) return;
    const tip = await fetchTip();
    if (!tip || !isPlayingRef.current) return;
    setTipCount(c => c + 1);
    if (isSpeakingRef.current) {
      tipQueueRef.current.push(tip);
    } else {
      setCurrentTip(tip);
      speakTip(tip);
    }
  }, [fetchTip, speakTip]);

  // Stop radio mode
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    tipQueueRef.current = [];
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (utteranceRef.current) { window.speechSynthesis.cancel(); utteranceRef.current = null; }
    isSpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Start radio mode
  const start = useCallback((config: RadioModeConfig) => {
    configRef.current = config;
    isPlayingRef.current = true;
    tipQueueRef.current = [];
    offlineIndexRef.current = 0;
    setIsPlaying(true);
    setTipCount(0);
    setCurrentTip('');

    if (navigator.onLine) {
      // Online: fetch from API
      fetchAndPlay();
      intervalRef.current = setInterval(() => { fetchAndPlay(); }, intervalSeconds * 1000);
    } else {
      // Offline: play from cache
      const result = playNextCachedTip();
      if (result === 'exhausted') return;
      intervalRef.current = setInterval(() => {
        const r = playNextCachedTip();
        if (r === 'exhausted') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, intervalSeconds * 1000);
    }
  }, [fetchAndPlay, playNextCachedTip, intervalSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isPlaying, currentTip, tipCount, isFetching, isSpeaking,
    isOnline, cachedCount,
    start, stop,
  };
}
