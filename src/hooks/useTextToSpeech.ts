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
  tamang: 'ne-NP', // Fallback to Nepali
  newar: 'ne-NP', // Fallback to Nepali
  maithili: 'hi-IN', // Close to Maithili
  magar: 'ne-NP', // Fallback to Nepali
  rai: 'ne-NP', // Fallback to Nepali
};

// Helper to find the best voice for Nepali/South Asian languages
const findBestVoice = (voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null => {
  const langCode = targetLang.split('-')[0];
  
  // Priority 1: Exact match for Nepali
  const nepaliVoice = voices.find(v => 
    v.lang.toLowerCase().includes('ne') || 
    v.lang.toLowerCase().includes('nep') ||
    v.name.toLowerCase().includes('nepali')
  );
  if (nepaliVoice) return nepaliVoice;
  
  // Priority 2: Hindi voice (very similar to Nepali)
  const hindiVoice = voices.find(v => 
    v.lang.startsWith('hi') || 
    v.name.toLowerCase().includes('hindi')
  );
  if (hindiVoice && langCode !== 'en') return hindiVoice;
  
  // Priority 3: Any Indian language voice
  const indianVoice = voices.find(v => 
    v.lang.includes('IN') || 
    v.name.toLowerCase().includes('india')
  );
  if (indianVoice && langCode !== 'en') return indianVoice;
  
  // Priority 4: Match the target language
  const targetVoice = voices.find(v => v.lang.startsWith(langCode));
  if (targetVoice) return targetVoice;
  
  // Priority 5: Default voice
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  // Clean text for speech (remove markdown, emojis that don't speak well)
  const cleanTextForSpeech = (text: string): string => {
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
      // Remove emojis (keep some meaningful ones)
      .replace(/[🥇🥈🥉]/g, '')
      // Convert meaningful emojis to words
      .replace(/✅/g, 'Good news: ')
      .replace(/⚠️/g, 'Warning: ')
      .replace(/💡/g, 'Tip: ')
      .replace(/🌾/g, '')
      .replace(/📴/g, 'Offline mode: ')
      .replace(/🔍/g, '')
      .replace(/🍂/g, '')
      .replace(/🐛/g, '')
      .replace(/🥀/g, '')
      .replace(/⚪/g, '')
      .replace(/🌿/g, '')
      .replace(/💊/g, '')
      // Remove other emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  };

  const speak = useCallback((text: string, messageId?: string) => {
    if (!isSupported) {
      onError?.('Text-to-speech is not supported in this browser');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      onError?.('No text to speak');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Set language
    const speechLang = languageMap[language] || 'en-US';
    utterance.lang = speechLang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try to find the best voice for Nepali/target language
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = findBestVoice(voices, speechLang);
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      // Update utterance language to match voice for better pronunciation
      if (language !== 'en' && preferredVoice.lang.startsWith('hi')) {
        // Hindi voice speaks Nepali well, keep Hindi lang for better pronunciation
        utterance.lang = preferredVoice.lang;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
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
      setCurrentMessageId(null);
      utteranceRef.current = null;
      if (event.error !== 'canceled') {
        onError?.(`Speech error: ${event.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, language, rate, pitch, onStart, onEnd, onError]);

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

  // Load voices (they may load asynchronously)
  useEffect(() => {
    if (isSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isSupported,
    currentMessageId
  };
}
