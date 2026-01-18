import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceInputOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Map app languages to Web Speech API language codes for Nepal
const languageMap: Record<string, string> = {
  en: 'en-US',
  ne: 'ne-NP',
  tamang: 'ne-NP', // Fallback to Nepali
  newar: 'ne-NP', // Fallback to Nepali
  maithili: 'hi-IN', // Close to Maithili
  magar: 'ne-NP', // Fallback to Nepali
  rai: 'ne-NP', // Fallback to Nepali
};

// Nepali error messages
const nepaliErrorMessages: Record<string, string> = {
  'no-speech': 'कुनै आवाज सुनिएन। कृपया फेरि बोल्नुहोस्।',
  'audio-capture': 'माइक्रोफोन भेटिएन। कृपया आफ्नो उपकरण जाँच गर्नुहोस्।',
  'not-allowed': 'माइक्रोफोन पहुँच अस्वीकृत। कृपया माइक्रोफोन अनुमति दिनुहोस्।',
  'network': 'नेटवर्क त्रुटि। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।',
  'aborted': 'आवाज इनपुट रद्द भयो।',
  'language-not-supported': 'यो भाषा समर्थित छैन।',
};

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { language = 'ne', continuous = false } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  // Use refs for callbacks to avoid recreating recognition
  const onResultRef = useRef(options.onResult);
  const onErrorRef = useRef(options.onError);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = options.onResult;
  }, [options.onResult]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = languageMap[language] || 'ne-NP';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setInterimTranscript(interim);
        
        if (finalTranscript) {
          setTranscript(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
          if (onResultRef.current) {
            onResultRef.current(finalTranscript);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        const errorMessage = nepaliErrorMessages[event.error] || `आवाज त्रुटि: ${event.error}`;
        
        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setInterimTranscript('');
        
        // Auto-restart if continuous mode and still should be listening
        if (continuous && recognitionRef.current && isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Could not restart recognition:', e);
          }
        }
      };

      recognition.onspeechend = () => {
        console.log('Speech ended');
      };

      recognition.onaudiostart = () => {
        console.log('Audio capturing started');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('Error aborting recognition:', e);
        }
      }
    };
  }, [continuous]); // Remove language from dependencies to avoid recreating

  // Update language when it changes (without recreating recognition)
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageMap[language] || 'ne-NP';
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      try {
        // Request microphone permission explicitly
        navigator.mediaDevices?.getUserMedia({ audio: true })
          .then(() => {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Failed to start speech recognition:', error);
              if (onErrorRef.current) {
                onErrorRef.current('आवाज पहिचान सुरु गर्न असफल। कृपया पुनः प्रयास गर्नुहोस्।');
              }
            }
          })
          .catch((err) => {
            console.error('Microphone permission denied:', err);
            if (onErrorRef.current) {
              onErrorRef.current('माइक्रोफोन पहुँच अस्वीकृत। कृपया ब्राउजर सेटिङ्समा माइक्रोफोन अनुमति दिनुहोस्।');
            }
          });
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        if (onErrorRef.current) {
          onErrorRef.current('आवाज पहिचान सुरु गर्न असफल।');
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
