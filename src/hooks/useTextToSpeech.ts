import { useCallback, useEffect, useRef, useState } from "react";

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onOfflineLimitReached?: () => void; // Callback when offline TTS limit is reached
}

// Map app language codes to speech synthesis language codes
const languageMap: Record<string, string> = {
  en: "en-US",
  ne: "ne-NP",
  hi: "hi-IN",
  tamang: "ne-NP",
  newar: "ne-NP",
  maithili: "hi-IN",
  magar: "ne-NP",
  rai: "ne-NP",
};

// Detect if text contains significant Devanagari (Nepali/Hindi) script
function containsDevanagari(text: string): boolean {
  const devanagariPattern = /[\u0900-\u097F]/g;
  const matches = text.match(devanagariPattern);
  // If more than 10% of non-whitespace characters are Devanagari, consider it Nepali
  const nonWhitespace = text.replace(/\s/g, '').length;
  return matches ? (matches.length / nonWhitespace) > 0.1 : false;
}

function cleanTextForSpeech(text: string, language: string = 'en'): string {
  const isNepali = language === 'ne' || language === 'hi' || containsDevanagari(text);
  
  let cleaned = text
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/^\d+\.\s/gm, "")
    
    // CRITICAL: Remove punctuation that TTS might read aloud
    // Replace multiple punctuation with single pause
    .replace(/[!]{2,}/g, "!")
    .replace(/[?]{2,}/g, "?")
    .replace(/[.]{3,}/g, ".")
    .replace(/[,]{2,}/g, ",")
    .replace(/[:]{2,}/g, ":")
    .replace(/[;]{2,}/g, ";")
    
    // Remove standalone punctuation on lines
    .replace(/^\s*[!?.,;:]+\s*$/gm, "")
    
    // Replace punctuation with natural pauses (spaces) when surrounded by spaces
    .replace(/\s+[!?]+\s+/g, " ")
    .replace(/\s+[,;:]+\s+/g, " ")
    
    // Clean up parentheses, brackets, and special chars that might be read
    .replace(/[()[\]{}]/g, " ")
    .replace(/["'"'""]/g, " ")
    .replace(/[|\\/<>@#$%^&*+=~`]/g, " ")
    
    // Remove dash/hyphen patterns that might be spoken
    .replace(/\s*[-–—]+\s*/g, " ")
    
    // Clean Nepali-specific punctuation (purna viram, etc.)
    .replace(/।+/g, ". ")
    .replace(/॥+/g, ". ");
  
  // Language-specific emoji replacements
  if (isNepali) {
    cleaned = cleaned
      .replace(/✅/g, "राम्रो ")
      .replace(/⚠️/g, "सावधान ")
      .replace(/💡/g, "सुझाव ")
      .replace(/📴/g, "अफलाइन ")
      .replace(/🔍/g, "")
      .replace(/🌾/g, "")
      .replace(/🍂/g, "")
      .replace(/🐛/g, "")
      .replace(/🥀/g, "")
      .replace(/⚪/g, "")
      .replace(/🌿/g, "जैविक ")
      .replace(/💊/g, "रासायनिक ")
      .replace(/🥇|🥈|🥉/g, "")
      .replace(/➡️|→|←|↑|↓/g, "");
  } else {
    cleaned = cleaned
      .replace(/✅/g, "Good ")
      .replace(/⚠️/g, "Warning ")
      .replace(/💡/g, "Tip ")
      .replace(/📴/g, "Offline ")
      .replace(/🔍|🌾|🍂|🐛|🥀|⚪|🌿|💊|🥇|🥈|🥉|➡️|→|←|↑|↓/g, "");
  }
  
  // Remove remaining emojis/symbols but PRESERVE Devanagari script (U+0900-U+097F)
  cleaned = cleaned
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1") // Remove space before punctuation
    .trim();
    
  return cleaned;
}

function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  const femaleIndicators = [
    "female",
    "woman",
    "girl",
    "zira",
    "samantha",
    "victoria",
    "karen",
    "moira",
    "tessa",
    "veena",
    "lekha",
    "priya",
    "aditi",
    "raveena",
    "google us english female",
    "heera",
    "kalpana",
  ];
  const maleIndicators = ["male", "man", "boy", "david", "daniel", "alex", "fred", "tom", "rishi"];

  if (femaleIndicators.some((ind) => name.includes(ind))) return true;
  if (maleIndicators.some((ind) => name.includes(ind))) return false;
  if (name.includes("google")) return true;
  return false;
}

function findBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const langCode = targetLang.split("-")[0];
  const femaleVoices = voices.filter(isFemaleVoice);
  const pool = femaleVoices.length > 0 ? femaleVoices : voices;

  // 1) Nepali
  let v = pool.find((x) => x.lang.toLowerCase().includes("ne") || x.name.toLowerCase().includes("nepali"));
  if (v) return v;

  // 2) Hindi when not English
  v = pool.find((x) => x.lang.startsWith("hi") || x.name.toLowerCase().includes("hindi"));
  if (v && langCode !== "en") return v;

  // 3) Any IN when not English
  v = pool.find((x) => x.lang.includes("IN"));
  if (v && langCode !== "en") return v;

  // 4) language match
  v = pool.find((x) => x.lang.startsWith(langCode));
  if (v) return v;

  // 5) female English
  v = femaleVoices.find((x) => x.lang.startsWith("en"));
  if (v) return v;

  // 6) google
  v = voices.find((x) => x.name.toLowerCase().includes("google"));
  if (v) return v;

  // 7) default
  return voices.find((x) => x.default) || voices[0] || null;
}

function getElevenLabsFunctionUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/functions/v1/elevenlabs-tts`;
}

// Offline TTS usage tracking
const OFFLINE_TTS_LIMIT = 3;
const OFFLINE_TTS_STORAGE_KEY = 'offline_tts_count';

function getOfflineTTSCount(): number {
  try {
    return parseInt(localStorage.getItem(OFFLINE_TTS_STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function incrementOfflineTTSCount(): number {
  const count = getOfflineTTSCount() + 1;
  try {
    localStorage.setItem(OFFLINE_TTS_STORAGE_KEY, count.toString());
  } catch {}
  return count;
}

// Circuit-breaker: once ElevenLabs fails, skip it for the rest of the session
let elevenLabsDisabled = false;

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  // Default to faster rate (1.15) for quicker voice responses
  const { language = "en", rate = 1.15, pitch = 1, onStart, onEnd, onError, onOfflineLimitReached } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [offlineTTSUsed, setOfflineTTSUsed] = useState(getOfflineTTSCount());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const isBrowserTTSSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load browser voices (for fallback)
  useEffect(() => {
    if (!isBrowserTTSSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesRef.current = voices;
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [isBrowserTTSSupported]);

  const stop = useCallback(() => {
    // stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // stop browser TTS
    if (isBrowserTTSSupported) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsLoading(false);
    setCurrentMessageId(null);
  }, [isBrowserTTSSupported]);

  const speakWithBrowser = useCallback(
    (cleanedText: string, messageId?: string, isOfflineFallback: boolean = false) => {
      console.log('[Browser TTS] Starting with text length:', cleanedText.length, 'isOfflineFallback:', isOfflineFallback);
      
      if (!isBrowserTTSSupported) {
        console.error('[Browser TTS] Not supported on this device');
        setIsLoading(false);
        setIsSpeaking(false);
        setCurrentMessageId(null);
        onError?.("Text-to-speech is not supported on this device");
        return;
      }

      // Check offline TTS limit ONLY when truly offline
      if (isOfflineFallback && !navigator.onLine) {
        const currentCount = getOfflineTTSCount();
        if (currentCount >= OFFLINE_TTS_LIMIT) {
          console.warn('[Browser TTS] Offline limit reached');
          setIsLoading(false);
          setIsSpeaking(false);
          setCurrentMessageId(null);
          onOfflineLimitReached?.();
          return;
        }
        const newCount = incrementOfflineTTSCount();
        setOfflineTTSUsed(newCount);
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utteranceRef.current = utterance;

        const speechLang = languageMap[language] || "en-US";
        utterance.lang = speechLang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Get voices - wait a bit if not loaded yet
        let voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        
        // Chrome sometimes needs a moment to load voices
        if (voices.length === 0) {
          console.log('[Browser TTS] Voices not loaded, using default');
        }
        
        const preferred = findBestVoice(voices, speechLang);
        if (preferred) {
          utterance.voice = preferred;
          console.log('[Browser TTS] Using voice:', preferred.name, preferred.lang);
          if (language !== "en" && preferred.lang.startsWith("hi")) {
            utterance.lang = preferred.lang;
          }
        } else {
          console.log('[Browser TTS] No preferred voice found, using system default');
        }

        utterance.onstart = () => {
          console.log('[Browser TTS] Started speaking');
          setIsLoading(false);
          setIsSpeaking(true);
          setCurrentMessageId(messageId || null);
          onStart?.();
        };

        utterance.onend = () => {
          console.log('[Browser TTS] Finished speaking');
          setIsSpeaking(false);
          setCurrentMessageId(null);
          utteranceRef.current = null;
          onEnd?.();
        };

        utterance.onerror = (event) => {
          console.error('[Browser TTS] Error:', event.error);
          setIsLoading(false);
          setIsSpeaking(false);
          setCurrentMessageId(null);
          utteranceRef.current = null;
          if (event.error !== "canceled") onError?.(`Speech error: ${event.error}`);
        };

        // Actually start speaking
        window.speechSynthesis.speak(utterance);
        console.log('[Browser TTS] speak() called');
        
        // Chrome bug workaround: resume if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        console.error('[Browser TTS] Exception:', e);
        setIsLoading(false);
        setIsSpeaking(false);
        setCurrentMessageId(null);
        onError?.("Browser speech synthesis failed");
      }
    },
    [isBrowserTTSSupported, language, rate, pitch, onStart, onEnd, onError, onOfflineLimitReached]
  );

  const speak = useCallback(
    async (text: string, messageId?: string) => {
      stop();

      const cleaned = cleanTextForSpeech(text, language);
      if (!cleaned || cleaned.length < 2) {
        onError?.("No text to speak");
        return;
      }

      const textToSpeak = cleaned.slice(0, 4500);

      setIsLoading(true);
      setCurrentMessageId(messageId || null);

      // Circuit-breaker: skip ElevenLabs if it already failed this session
      if (elevenLabsDisabled) {
        speakWithBrowser(textToSpeak, messageId);
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(getElevenLabsFunctionUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: textToSpeak,
            language: language, // Pass language for voice selection (ne, hi, en)
            // Voice will be auto-selected based on language in the edge function
          }),
          signal: abortControllerRef.current.signal,
        });

        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        // When ElevenLabs is blocked, the backend returns 200 + JSON payload.
        // Treat that as a soft failure and fall back to browser TTS.
        if (!response.ok || isJson) {
          // Trip the circuit-breaker
          elevenLabsDisabled = true;
          console.warn("ElevenLabs circuit-breaker tripped. Using browser TTS for this session.");

          if (isJson) {
            try {
              const payload = await response.json();
              console.warn("ElevenLabs TTS unavailable:", payload);
            } catch {
              // ignore
            }
          }
          speakWithBrowser(textToSpeak, messageId, true);
          return;
        }

        const audioBlob = await response.blob();
        if (audioBlob.size < 1000) {
          speakWithBrowser(textToSpeak, messageId, true);
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
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          speakWithBrowser(textToSpeak, messageId, true);
        };

        await audio.play();
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        speakWithBrowser(textToSpeak, messageId, true);
      }
    },
    [stop, speakWithBrowser, onStart, onEnd, onError]
  );

  const toggle = useCallback(
    (text: string, messageId?: string) => {
      if ((isSpeaking || isLoading) && currentMessageId === messageId) stop();
      else speak(text, messageId);
    },
    [currentMessageId, isLoading, isSpeaking, speak, stop]
  );

  return {
    speak,
    stop,
    toggle,
    isSpeaking,
    isLoading,
    isSupported: true,
    currentMessageId,
    offlineTTSUsed,
    offlineTTSLimit: OFFLINE_TTS_LIMIT,
  };
}
