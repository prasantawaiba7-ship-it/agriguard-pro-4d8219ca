import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Clean text for speech - remove markdown, emojis, etc.
function cleanTextForSpeech(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/^\d+\.\s/gm, '')
    // Clean up punctuation issues
    .replace(/\?{2,}/g, '?')
    .replace(/!{2,}/g, '!')
    .replace(/\.{3,}/g, '.')
    .replace(/^\s*[\?\!\.]+\s*$/gm, '')
    .replace(/\s+[\?\!]+\s+/g, ' ')
    // Replace emojis with spoken equivalents
    .replace(/✅/g, 'Good news: ')
    .replace(/⚠️/g, 'Warning: ')
    .replace(/💡/g, 'Tip: ')
    .replace(/📴/g, 'Offline mode: ')
    // Remove other emojis
    .replace(/🔍|🌾|🍂|🐛|🥀|⚪|🌿|💊|🥇|🥈|🥉/g, '')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    onStart,
    onEnd,
    onError
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
    setCurrentMessageId(null);
  }, []);

  const speak = useCallback(async (text: string, messageId?: string) => {
    // Stop any current speech
    stop();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.length < 2) {
      onError?.('No text to speak');
      return;
    }

    // Limit text length to avoid API limits (max ~5000 chars)
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
          // Sarah - natural female voice
          voiceId: 'EXAVITQu4vr4xnSDxMaL'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
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

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setIsLoading(false);
        setCurrentMessageId(null);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        onError?.('Audio playback failed');
      };

      await audio.play();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('TTS request aborted');
        return;
      }
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setIsLoading(false);
      setCurrentMessageId(null);
      onError?.(error.message || 'Failed to generate speech');
    }
  }, [stop, onStart, onEnd, onError]);

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
    isSupported: true, // ElevenLabs is always supported
    currentMessageId
  };
}
