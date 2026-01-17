import { useCallback, useEffect, useRef, useState } from "react";

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
  en: "en-US",
  ne: "ne-NP",
  tamang: "ne-NP",
  newar: "ne-NP",
  maithili: "hi-IN",
  magar: "ne-NP",
  rai: "ne-NP",
};

function cleanTextForSpeech(text: string): string {
  return text
    // markdown
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/^\d+\.\s/gm, "")
    // punctuation normalization
    .replace(/\?{2,}/g, "?")
    .replace(/!{2,}/g, "!")
    .replace(/\.{3,}/g, ".")
    .replace(/^\s*[\?\!\.]+\s*$/gm, "")
    .replace(/\s+[\?\!]+\s+/g, " ")
    // emoji-to-words
    .replace(/✅/g, "Good news: ")
    .replace(/⚠️/g, "Warning: ")
    .replace(/💡/g, "Tip: ")
    .replace(/📴/g, "Offline mode: ")
    // remove most emojis/symbols
    .replace(/🔍|🌾|🍂|🐛|🥀|⚪|🌿|💊|🥇|🥈|🥉/g, "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    // whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
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

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const { language = "en", rate = 0.9, pitch = 1, onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

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
    (cleanedText: string, messageId?: string) => {
      if (!isBrowserTTSSupported) {
        setIsLoading(false);
        setIsSpeaking(false);
        setCurrentMessageId(null);
        onError?.("Text-to-speech is not supported on this device");
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utteranceRef.current = utterance;

        const speechLang = languageMap[language] || "en-US";
        utterance.lang = speechLang;
        utterance.rate = rate;
        utterance.pitch = pitch;

        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        const preferred = findBestVoice(voices, speechLang);
        if (preferred) {
          utterance.voice = preferred;
          if (language !== "en" && preferred.lang.startsWith("hi")) {
            utterance.lang = preferred.lang;
          }
        }

        utterance.onstart = () => {
          setIsLoading(false);
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
          setIsLoading(false);
          setIsSpeaking(false);
          setCurrentMessageId(null);
          utteranceRef.current = null;
          if (event.error !== "canceled") onError?.(`Speech error: ${event.error}`);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsLoading(false);
        setIsSpeaking(false);
        setCurrentMessageId(null);
        onError?.("Browser speech synthesis failed");
      }
    },
    [isBrowserTTSSupported, language, rate, pitch, onStart, onEnd, onError]
  );

  const speak = useCallback(
    async (text: string, messageId?: string) => {
      stop();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned || cleaned.length < 2) {
        onError?.("No text to speak");
        return;
      }

      const textToSpeak = cleaned.slice(0, 4500);

      setIsLoading(true);
      setCurrentMessageId(messageId || null);
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
            // Sarah (female)
            voiceId: "EXAVITQu4vr4xnSDxMaL",
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          // Key is blocked (401) -> fallback
          speakWithBrowser(textToSpeak, messageId);
          return;
        }

        const audioBlob = await response.blob();
        if (audioBlob.size < 1000) {
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
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          speakWithBrowser(textToSpeak, messageId);
        };

        await audio.play();
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        speakWithBrowser(textToSpeak, messageId);
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
  };
}
