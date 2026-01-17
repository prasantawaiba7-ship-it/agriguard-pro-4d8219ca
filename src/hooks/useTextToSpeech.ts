import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Map app language codes to speech synthesis language codes
const languageMap: Record<string, string> = {
  en: 'en-US',
  ne: 'ne-NP',
  tamang: 'ne-NP',
  newar: 'ne-NP',
  maithili: 'hi-IN',
  magar: 'ne-NP',
  rai: 'ne-NP',
};

// Helper to check if a voice is likely female
function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  const femaleIndicators = [
    'female', 'woman', 'girl', 
    'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 
    'veena', 'lekha', 'priya', 'aditi', 'raveena',
    'google us english female', 'heera', 'kalpana'
  ];
  const maleIndicators = ['male', 'man', 'boy', 'david', 'daniel', 'alex', 'fred', 'tom', 'rishi'];
  
  if (femaleIndicators.some(ind => name.includes(ind))) return true;
  if (maleIndicators.some(ind => name.includes(ind))) return false;
  if (name.includes('google')) return true;
  return false;
}

// Helper to find the best voice - prefer female voices
function findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  
  const langCode = targetLang.split('-')[0];
  const femaleVoices = voices.filter(isFemaleVoice);
  const voicePool = femaleVoices.length > 0 ? femaleVoices : voices;
  
  // Priority 1: Female Nepali voice
  let voice = voicePool.find(v => 
    v.lang.toLowerCase().includes('ne') || v.name.toLowerCase().includes('nepali')
  );
  if (voice) return voice;
  
  // Priority 2: Female Hindi voice
  voice = voicePool.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
  if (voice && langCode !== 'en') return voice;
  
  // Priority 3: Female Indian language voice
  voice = voicePool.find(v => v.lang.includes('IN'));
  if (voice && langCode !== 'en') return voice;
  
  // Priority 4: Voice matching target language
  voice = voicePool.find(v => v.lang.startsWith(langCode));
  if (voice) return voice;
  
  // Priority 5: Any female English voice
  voice = femaleVoices.find(v => v.lang.startsWith('en'));
  if (voice) return voice;
  
  // Priority 6: Google voice
  voice = voices.find(v => v.name.toLowerCase().includes('google'));
  if (voice) return voice;
  
  // Priority 7: Default
  return voices.find(v => v.default) || voices[0] || null;
}

// Clean text for speech - remove markdown, emojis, etc.
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\?{2,}/g, '?')
    .replace(/!{2,}/g, '!')
    .replace(/\.{3,}/g, '.')
    .replace(/^\s*[\?\!\.]+\s*$/gm, '')
    .replace(/\s+[\?\!]+\s+/g, ' ')
    .replace(/✅/g, 'Good news: ')
    .replace(/⚠️/g, 'Warning: ')
    .replace(/💡/g, 'Tip: ')
    .replace(/📴/g, 'Offline mode: ')
    .replace(/🔍|🌾|🍂|🐛|🥀|⚪|🌿|💊|🥇|🥈|🥉/g, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    language = 'en',
    rate = 0.9,
    pitch = 1,
    onStart,
    onEnd,
    onError
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isBrowserTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load browser voices
  useEffect(() => {
    if (!isBrowserTTSSupported) return;
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [isBrowserTTSSupported]);

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop browser TTS
    if (isBrowserTTSSupported) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsLoading(false);
    setCurrentMessageId(null);
  }, [isBrowserTTSSupported]);

  // Fallback to browser TTS
  const speakWithBrowser = useCallback((text: string, messageId?: string) => {
    if (!isBrowserTTSSupported) {
      onError?.('Text-to-speech is not supported');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const speechLang = languageMap[language] || 'en-US';
    utterance.lang = speechLang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const preferredVoice = findBestVoice(voices, speechLang);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      if (language !== 'en' && preferredVoice.lang.startsWith('hi')) {
        utterance.lang = preferredVoice.lang;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsLoading(false);
      setCurrentMessageId(messageId || null);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentMessageId(null);
      utteranceRef.current = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setIsLoading(false);
      setCurrentMessageId(null);
      utteranceRef.current = null;
      if (event.error !== 'canceled') {
        onError?.(`Speech error: ${event.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [isBrowserTTSSupported, language, rate, pitch, onStart, onEnd, onError]);

  // Try ElevenLabs first, fallback to browser TTS
  const speak = useCallback(async (text: string, messageId?: string) => {
    stop();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.length < 2) {
      onError?.('No text to speak');
      return;
    }

    const textToSpeak = cleanedText.slice(0, 4500);

    setIsLoading(true);
    setCurrentMessageId(messageId || null);
    abortControllerRef.current = new AbortController();

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/elevenlabs-tts`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          text: textToSpeak,
          voiceId: 'EXAVITQu4vr4xnSDxMaL'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        console.warn('ElevenLabs TTS failed, falling back to browser TTS');
        speakWithBrowser(textToSpeak, messageId);
        return;
      }

      const audioBlob = await response.blob();
      
      // Check if we got valid audio
      if (audioBlob.type !== 'audio/mpeg' && audioBlob.size < 1000) {
        console.warn('Invalid audio response, falling back to browser TTS');
        speakWithBrowser(textToSpeak, messageId);
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadeddata = () => {
        setIsLoading(false);
        setIsSpeaking(true);
        onStart?.();
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        onEnd?.();
      };

      audio.onerror = () => {
        console.warn('Audio playback failed, falling back to browser TTS');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        speakWithBrowser(textToSpeak, messageId);
      };

      await audio.play();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('TTS request aborted');
        return;
      }
      console.warn('ElevenLabs TTS error, falling back to browser TTS:', error.message);
      speakWithBrowser(textToSpeak, messageId);
    }
  }, [stop, speakWithBrowser, onStart, onEnd, onError]);

  const toggle = useCallback((text: string, messageId?: string) => {
    if ((isSpeaking || isLoading) && currentMessageId === messageId) {
      stop();
    } else {
      speak(text, messageId);
    }
  }, [isSpeaking, isLoading, currentMessageId, speak, stop]);

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isLoading,
    isSupported: true,
    currentMessageId
  };
}
