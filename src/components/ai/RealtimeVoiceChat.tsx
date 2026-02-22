import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealtimeVoiceChatProps {
  language: 'ne' | 'hi' | 'en';
  onClose: () => void;
  onShowPremium?: () => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'model_error';

export function RealtimeVoiceChat({ language, onClose, onShowPremium }: RealtimeVoiceChatProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((msg: string) => {
    console.log('[VoiceChat]', msg);
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setTranscript('');
    setAiResponse('');
    setDebugLog([]);
    
    try {
      // Step 1: Request microphone
      addLog('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      addLog('Microphone granted ✓');

      // Step 2: Get ephemeral token
      addLog('Getting session token...');
      const { data, error } = await supabase.functions.invoke('realtime-token', {
        body: { language, speed: 1.0 }
      });

      if (error) {
        addLog(`Token error: ${error.message}`);
        throw new Error(error.message || 'Failed to get session token');
      }
      
      if (!data?.client_secret?.value) {
        addLog(`Token response missing client_secret: ${JSON.stringify(data).slice(0, 200)}`);
        throw new Error('No ephemeral key in response');
      }

      const ephemeralKey = data.client_secret.value;
      addLog(`Token received ✓ (${ephemeralKey.slice(0, 10)}...)`);

      // Step 3: Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [] // OpenAI doesn't need ICE servers
      });
      pcRef.current = pc;

      // Track connection state changes
      pc.oniceconnectionstatechange = () => {
        addLog(`ICE state: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          addLog('ICE connection failed/disconnected!');
          toast({
            title: language === 'ne' ? 'जडान टुट्यो' : 'Connection lost',
            variant: 'destructive'
          });
        }
      };

      pc.onconnectionstatechange = () => {
        addLog(`Connection state: ${pc.connectionState}`);
      };

      // Step 4: Set up audio playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', 'true');
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        addLog(`Remote track received: ${event.track.kind}, streams: ${event.streams.length}`);
        if (event.streams[0]) {
          audioEl.srcObject = event.streams[0];
          audioEl.play().then(() => {
            addLog('Audio playback started ✓');
          }).catch(err => {
            addLog(`Autoplay blocked: ${err.message}`);
            // Try playing on next user interaction
            const resumeAudio = () => {
              audioEl.play().catch(() => {});
              document.removeEventListener('click', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
          });
        } else {
          addLog('WARNING: No streams in track event!');
        }
      };

      // Step 5: Add microphone track
      const audioTrack = stream.getAudioTracks()[0];
      addLog(`Adding mic track: ${audioTrack.label}`);
      pc.addTrack(audioTrack, stream);

      // Step 6: Create data channel
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        addLog('Data channel opened ✓');
      };

      dc.onerror = (e) => {
        addLog(`Data channel error: ${JSON.stringify(e)}`);
      };

      dc.onclose = () => {
        addLog('Data channel closed');
      };

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Log important events fully
          if (['session.created', 'session.updated', 'error', 'response.done', 
               'conversation.item.input_audio_transcription.failed'].includes(msg.type)) {
            addLog(`EVENT [${msg.type}]: ${JSON.stringify(msg).slice(0, 400)}`);
          } else {
            addLog(`Event: ${msg.type}`);
          }
          
          // On session created, send greeting
          if (msg.type === 'session.created') {
            addLog('Session created! Sending greeting...');
            
            const greetingText = language === 'ne' 
              ? 'नमस्ते भन्नुहोस् र आफूलाई कृषि मित्र भनेर चिनाउनुहोस्।'
              : 'Say hello and introduce yourself as Krishi Mitra.';
            
            dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: greetingText }]
              }
            }));
            
            dc.send(JSON.stringify({ type: 'response.create' }));
            addLog('Greeting sent ✓');
          }
          
          handleRealtimeEvent(msg);
        } catch (e) {
          addLog(`Parse error: ${e}`);
        }
      };

      // Step 7: Create offer and connect to OpenAI
      addLog('Creating WebRTC offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      addLog('Local description set ✓');

      addLog('Sending offer to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`OpenAI SDP error ${response.status}: ${errorText.slice(0, 200)}`);
        throw new Error(`OpenAI returned ${response.status}: ${errorText.slice(0, 100)}`);
      }

      const answerSdp = await response.text();
      addLog(`Answer SDP received ✓ (${answerSdp.length} chars)`);
      
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      addLog('Remote description set ✓ - WebRTC connected!');

      setStatus('connected');
      
      // Start call duration timer
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);

      toast({
        title: language === 'ne' ? '📞 जोडियो!' : '📞 Connected!',
        description: language === 'ne' ? 'अब बोल्न सक्नुहुन्छ' : 'You can speak now',
      });

    } catch (error) {
      console.error('[VoiceChat] Connection error:', error);
      addLog(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
      toast({
        title: language === 'ne' ? 'जडान असफल' : 'Connection Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      disconnect();
    }
  }, [language, toast, addLog]);

  const disconnect = useCallback(() => {
    addLog('Disconnecting...');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }

    setStatus('disconnected');
    setIsSpeaking(false);
  }, [addLog]);

  const handleRealtimeEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        setAiResponse(prev => prev + (event.delta || ''));
        break;
      case 'response.audio_transcript.done':
        break;
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
      case 'response.audio.done':
        setIsSpeaking(false);
        break;
      case 'response.done':
        // Check for model_not_found error
        if (event.response?.status === 'failed') {
          const err = event.response?.status_details?.error;
          console.error('[VoiceChat] Response failed:', err);
          if (err?.code === 'model_not_found') {
            addLog(`MODEL ERROR: ${err.message}`);
            setStatus('model_error');
            toast({
              title: language === 'ne' ? 'Model उपलब्ध छैन' : 'Model Not Available',
              description: language === 'ne' 
                ? 'तपाईंको OpenAI API key मा Realtime model access छैन।' 
                : 'Your OpenAI API key does not have Realtime model access.',
              variant: 'destructive'
            });
          }
        }
        break;
      case 'input_audio_buffer.speech_started':
        setIsSpeaking(true);
        setTranscript('');
        break;
      case 'input_audio_buffer.speech_stopped':
        setIsSpeaking(false);
        break;
      case 'conversation.item.input_audio_transcription.completed':
        setTranscript(event.transcript || '');
        setAiResponse('');
        break;
      case 'error':
        console.error('[VoiceChat] Error event:', event);
        toast({
          title: 'Error',
          description: event.error?.message || 'An error occurred',
          variant: 'destructive'
        });
        break;
    }
  }, [toast, language, addLog]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center p-4"
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          disconnect();
          onClose();
        }}
        className="absolute top-4 right-4"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Call Duration */}
      {status === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 text-sm font-mono text-muted-foreground"
        >
          {formatDuration(callDuration)}
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {/* Voice Animation Circle */}
        <div className="relative">
          <motion.div
            className={cn(
              "w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center",
              status === 'connected' ? 'bg-primary' : 'bg-muted'
            )}
            animate={status === 'connected' ? {
              scale: isSpeaking ? [1, 1.1, 1] : 1,
              boxShadow: isSpeaking 
                ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 30px rgba(34, 197, 94, 0)', '0 0 0 0 rgba(34, 197, 94, 0)']
                : '0 0 0 0 transparent'
            } : {}}
            transition={{ repeat: isSpeaking ? Infinity : 0, duration: 1 }}
          >
            {status === 'connecting' ? (
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground animate-spin" />
            ) : status === 'connected' ? (
              <Volume2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
            ) : (
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            )}
          </motion.div>

          {/* Speaking indicator rings */}
          {status === 'connected' && isSpeaking && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary/30"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary/20"
                animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
              />
            </>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold">
            {status === 'disconnected' && (language === 'ne' ? 'भ्वाइस कल' : 'Voice Call')}
            {status === 'connecting' && (language === 'ne' ? 'जोड्दैछु...' : 'Connecting...')}
            {status === 'connected' && (isSpeaking 
              ? (language === 'ne' ? 'तपाईं बोल्दै हुनुहुन्छ...' : 'You are speaking...')
              : (language === 'ne' ? 'सुन्दैछु...' : 'Listening...')
            )}
            {status === 'error' && (language === 'ne' ? 'जडान असफल' : 'Connection Failed')}
            {status === 'model_error' && (language === 'ne' ? '⚠️ Model उपलब्ध छैन' : '⚠️ Model Not Available')}
          </h2>
          
          {status === 'disconnected' && (
            <p className="text-sm text-muted-foreground">
              {language === 'ne' 
                ? 'AI सँग नेपालीमा सिधै बोल्नुहोस्' 
                : 'Talk directly with AI in your language'}
            </p>
          )}
          {status === 'model_error' && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive max-w-sm">
              {language === 'ne' 
                ? 'तपाईंको OpenAI API key मा Realtime model access enable छैन। कृपया OpenAI Dashboard मा गएर Realtime API access check गर्नुहोस्।' 
                : 'Your OpenAI API key does not have Realtime model access. Please check your OpenAI Dashboard to enable Realtime API access.'}
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {(transcript || aiResponse) && status === 'connected' && (
          <div className="w-full max-h-40 overflow-y-auto space-y-2 p-4 bg-muted/50 rounded-xl">
            {transcript && (
              <p className="text-sm text-right text-primary font-medium">
                {transcript}
              </p>
            )}
            {aiResponse && (
              <p className="text-sm text-left text-muted-foreground">
                {aiResponse}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {status === 'disconnected' || status === 'error' || status === 'model_error' ? (
            <Button
              size="lg"
              onClick={connect}
              className="gap-2 px-8 py-6 text-lg rounded-full bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-5 h-5" />
              {language === 'ne' ? 'कल सुरु गर्नुहोस्' : 'Start Call'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={disconnect}
              disabled={status === 'connecting'}
              className="gap-2 px-8 py-6 text-lg rounded-full"
            >
              <PhoneOff className="w-5 h-5" />
              {language === 'ne' ? 'कल अन्त्य' : 'End Call'}
            </Button>
          )}
        </div>

        {/* Debug Log - visible during error or connected */}
        {debugLog.length > 0 && (
          <div className="w-full max-h-32 overflow-y-auto p-3 bg-black/80 rounded-lg text-xs font-mono text-green-400 space-y-0.5">
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}

        {/* Premium Feature Notice */}
        {onShowPremium && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowPremium}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <Crown className="w-3 h-3 mr-1" />
            {language === 'ne' ? 'असीमित कलको लागि प्रीमियम' : 'Premium for unlimited calls'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
