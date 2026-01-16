import { useState, useCallback, useEffect, useRef } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Map app language codes to speech synthesis language codes for Nepal
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
const isFemaleVoice = (voice: SpeechSynthesisVoice): boolean => {
  const name = voice.name.toLowerCase();
  const femaleIndicators = [
    'female', 'woman', 'girl', 
    'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 
    'veena', 'lekha', 'priya', 'aditi', 'raveena',
    'microsoft zira', 'google us english female',
    'heera', 'kalpana'
  ];
  const maleIndicators = ['male', 'man', 'boy', 'david', 'daniel', 'alex', 'fred', 'tom', 'rishi', 'microsoft david'];
  
  if (femaleIndicators.some(ind => name.includes(ind))) return true;
  if (maleIndicators.some(ind => name.includes(ind))) return false;
  if (name.includes('google')) return true;
  if (name.includes('microsoft') && !maleIndicators.some(ind => name.includes(ind))) return true;
  return false;
};

// Helper to find the best voice - prefer female voices
const findBestVoice = (voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null => {
  if (voices.length === 0) return null;
  
  const langCode = targetLang.split('-')[0];
  const femaleVoices = voices.filter(isFemaleVoice);
  const voicePool = femaleVoices.length > 0 ? femaleVoices : voices;
  
  // Priority 1: Female Nepali voice
  const nepaliVoice = voicePool.find(v => 
    v.lang.toLowerCase().includes('ne') || 
    v.lang.toLowerCase().includes('nep') ||
    v.name.toLowerCase().includes('nepali')
  );
  if (nepaliVoice) return nepaliVoice;
  
  // Priority 2: Female Hindi voice (very similar to Nepali)
  const hindiVoice = voicePool.find(v => 
    v.lang.startsWith('hi') || 
    v.name.toLowerCase().includes('hindi')
  );
  if (hindiVoice && langCode !== 'en') return hindiVoice;
  
  // Priority 3: Any female Indian language voice
  const indianVoice = voicePool.find(v => 
    v.lang.includes('IN') || 
    v.name.toLowerCase().includes('india')
  );
  if (indianVoice && langCode !== 'en') return indianVoice;
  
  // Priority 4: Female voice matching the target language
  const targetVoice = voicePool.find(v => v.lang.startsWith(langCode));
  if (targetVoice) return targetVoice;
  
  // Priority 5: Any female English voice as fallback
  const englishFemale = femaleVoices.find(v => v.lang.startsWith('en'));
  if (englishFemale) return englishFemale;
  
  // Priority 6: Google voice (usually good quality)
  const googleVoice = voices.find(v => v.name.toLowerCase().includes('google'));
  if (googleVoice) return googleVoice;
  
  // Priority 7: Any female voice
  if (femaleVoices.length > 0) return femaleVoices[0];
  
  // Priority 8: Default voice
  return voices.find(v => v.default) || voices[0] || null;
};

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
  const [isSupported, setIsSupported] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Initialize and load voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
        setVoicesLoaded(true);
        console.log('TTS: Loaded', voices.length, 'voices');
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    const timeout = setTimeout(loadVoices, 500);
    
    return () => {
      clearTimeout(timeout);
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Clean text for speech - remove markdown, emojis, and problematic characters
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove markdown bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove markdown headers
      .replace(/#{1,6}\s/g, '')
      // Remove bullet points but keep content
      .replace(/^\s*[-•]\s*/gm, '')
      // Remove numbered lists prefix
      .replace(/^\d+\.\s/gm, '')
      // Remove repeated punctuation that sounds bad
      .replace(/\?{2,}/g, '?')
      .replace(/!{2,}/g, '!')
      .replace(/\.{3,}/g, '.')
      // Remove standalone question marks or symbols
      .replace(/^\s*[\?\!\.]+\s*$/gm, '')
      .replace(/\s+[\?\!]+\s+/g, ' ')
      // Convert meaningful emojis to words
      .replace(/✅/g, 'Good news: ')
      .replace(/⚠️/g, 'Warning: ')
      .replace(/💡/g, 'Tip: ')
      .replace(/🔍/g, '')
      .replace(/📴/g, 'Offline mode: ')
      .replace(/🌾|🍂|🐛|🥀|⚪|🌿|💊|🥇|🥈|🥉/g, '')
      // Remove other emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }, []);

  const speak = useCallback((text: string, messageId?: string) => {
    if (!isSupported) {
      onError?.('Text-to-speech is not supported in this browser');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.length < 2) {
      onError?.('No text to speak');
      return;
    }

    console.log('TTS: Speaking text:', cleanedText.substring(0, 100) + '...');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Set language
    const speechLang = languageMap[language] || 'en-US';
    utterance.lang = speechLang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Find the best female voice
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const preferredVoice = findBestVoice(voices, speechLang);
    
    if (preferredVoice) {
      console.log('TTS: Using voice:', preferredVoice.name, preferredVoice.lang);
      utterance.voice = preferredVoice;
      // Use voice's language for better pronunciation
      if (language !== 'en' && preferredVoice.lang.startsWith('hi')) {
        utterance.lang = preferredVoice.lang;
      }
    } else {
      console.log('TTS: No preferred voice found, using default');
    }

    utterance.onstart = () => {
      console.log('TTS: Started speaking');
      setIsSpeaking(true);
      setCurrentMessageId(messageId || null);
      onStart?.();
    };

    utterance.onend = () => {
      console.log('TTS: Finished speaking');
      setIsSpeaking(false);
      setCurrentMessageId(null);
      utteranceRef.current = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('TTS: Error', event.error);
      setIsSpeaking(false);
      setCurrentMessageId(null);
      utteranceRef.current = null;
      if (event.error !== 'canceled') {
        onError?.(`Speech error: ${event.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, onStart, onEnd, onError, cleanTextForSpeech]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentMessageId(null);
    utteranceRef.current = null;
  }, []);

  const toggle = useCallback((text: string, messageId?: string) => {
    if (isSpeaking && currentMessageId === messageId) {
      stop();
    } else {
      speak(text, messageId);
    }
  }, [isSpeaking, currentMessageId, speak, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isLoading: false,
    isSupported,
    voicesLoaded,
    currentMessageId
  };
}
