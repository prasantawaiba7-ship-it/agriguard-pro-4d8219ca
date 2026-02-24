import { useState, useCallback, useRef, useEffect } from 'react';
import { saveTip, loadCachedTips, getCachedTipCount } from '@/lib/radioCache';

/** Silence gap between segments (ms). Change this to adjust pacing. */
const RADIO_GAP_MS = 12000;

interface RadioSegment {
  text: string;
  pauseMs: number;
}

interface RadioModeConfig {
  crop: string;
  stage: string;
  location?: string;
}

interface UseRadioModeOptions {
  language?: string;
}

const RADIO_TIP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/radio-tip`;

export function useRadioMode(options: UseRadioModeOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [tipCount, setTipCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedCount, setCachedCount] = useState(getCachedTipCount());
  const [isDemo, setIsDemo] = useState(false);

  const configRef = useRef<RadioModeConfig | null>(null);
  const isPlayingRef = useRef(false);
  const gapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentQueueRef = useRef<RadioSegment[]>([]);
  const offlineIndexRef = useRef(0);

  // Online/offline detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch a batch of segments from the edge function
  const fetchSegments = useCallback(async (): Promise<RadioSegment[] | null> => {
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
      
      if (data.fromAI === false) setIsDemo(true);
      else setIsDemo(false);

      const segments: RadioSegment[] = data.segments || [];
      
      // Cache each segment text
      if (configRef.current) {
        for (const seg of segments) {
          if (seg.text) {
            saveTip({
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              crop: configRef.current.crop,
              stage: configRef.current.stage,
              location: configRef.current.location,
              text: seg.text,
            });
          }
        }
        setCachedCount(getCachedTipCount());
      }
      return segments;
    } catch (err) {
      console.error('[RadioMode] Fetch error:', err);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Speak a single segment, returns a promise that resolves on end
  const speakSegment = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text) {
        resolve();
        return;
      }

      // Cancel any previous speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const nepaliVoice = voices.find(v => v.lang.includes('ne') || v.name.toLowerCase().includes('nepali'));
      const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
      if (nepaliVoice) utterance.voice = nepaliVoice;
      else if (hindiVoice) utterance.voice = hindiVoice;

      utterance.lang = 'ne-NP';
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (event) => {
        console.error('[RadioMode] TTS error:', event.error);
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Play through a queue of segments one by one with pauses
  const playSegmentQueue = useCallback(async () => {
    while (segmentQueueRef.current.length > 0 && isPlayingRef.current) {
      const seg = segmentQueueRef.current.shift()!;
      setCurrentTip(seg.text);
      setTipCount(c => c + 1);

      await speakSegment(seg.text);

      if (!isPlayingRef.current) return;

      // Wait for the segment's pause or the default gap
      const gap = seg.pauseMs || RADIO_GAP_MS;
      await new Promise<void>((resolve) => {
        gapTimeoutRef.current = setTimeout(() => {
          gapTimeoutRef.current = null;
          resolve();
        }, gap);
      });

      if (!isPlayingRef.current) return;
    }

    // Queue exhausted — if still playing, fetch next batch
    if (isPlayingRef.current) {
      if (navigator.onLine) {
        const segments = await fetchSegments();
        if (segments && segments.length > 0 && isPlayingRef.current) {
          segmentQueueRef.current = segments;
          playSegmentQueue();
        } else {
          // No more segments available, stop
          stopInternal();
        }
      } else {
        // Offline: try cached tips
        const cachedSegments = getOfflineBatch();
        if (cachedSegments.length > 0) {
          segmentQueueRef.current = cachedSegments;
          playSegmentQueue();
        } else {
          stopInternal();
        }
      }
    }
  }, [speakSegment, fetchSegments]);

  // Get a batch of cached tips for offline playback
  const getOfflineBatch = useCallback((): RadioSegment[] => {
    const tips = loadCachedTips();
    if (tips.length === 0) return [];
    const batch: RadioSegment[] = [];
    for (let i = 0; i < 6 && offlineIndexRef.current < tips.length; i++) {
      const tip = tips[tips.length - 1 - offlineIndexRef.current];
      offlineIndexRef.current++;
      batch.push({ text: tip.text, pauseMs: RADIO_GAP_MS });
    }
    return batch;
  }, []);

  const stopInternal = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    segmentQueueRef.current = [];
    if (gapTimeoutRef.current) { clearTimeout(gapTimeoutRef.current); gapTimeoutRef.current = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Public stop
  const stop = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  // Public start
  const start = useCallback(async (config: RadioModeConfig) => {
    configRef.current = config;
    isPlayingRef.current = true;
    segmentQueueRef.current = [];
    offlineIndexRef.current = 0;
    setIsPlaying(true);
    setTipCount(0);
    setCurrentTip('');

    if (navigator.onLine) {
      const segments = await fetchSegments();
      if (segments && segments.length > 0 && isPlayingRef.current) {
        segmentQueueRef.current = segments;
        playSegmentQueue();
      } else if (isPlayingRef.current) {
        // Fetch failed, try cache
        const cached = getOfflineBatch();
        if (cached.length > 0) {
          segmentQueueRef.current = cached;
          playSegmentQueue();
        } else {
          stopInternal();
        }
      }
    } else {
      const cached = getOfflineBatch();
      if (cached.length > 0) {
        segmentQueueRef.current = cached;
        playSegmentQueue();
      } else {
        stopInternal();
      }
    }
  }, [fetchSegments, playSegmentQueue, getOfflineBatch, stopInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (gapTimeoutRef.current) clearTimeout(gapTimeoutRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isPlaying, currentTip, tipCount, isFetching, isSpeaking,
    isOnline, cachedCount, isDemo,
    start, stop,
  };
}
