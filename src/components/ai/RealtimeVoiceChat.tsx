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

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function RealtimeVoiceChat({ language, onClose, onShowPremium }: RealtimeVoiceChatProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    
    try {
      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Get ephemeral token from edge function
      const { data, error } = await supabase.functions.invoke('realtime-token', {
        body: { language, speed: 1.0 }
      });

      if (error || !data?.client_secret?.value) {
        throw new Error(error?.message || 'Failed to get session token');
      }

      const ephemeralKey = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio playback - MUST append to DOM and handle autoplay policy
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.setAttribute('playsinline', 'true');
      document.body.appendChild(audioEl); // Append to DOM for autoplay to work
      audioElRef.current = audioEl;

      pc.ontrack = (event) => {
        console.log('[Realtime] Got remote audio track');
        audioEl.srcObject = event.streams[0];
        // Force play after user gesture (connect button click counts)
        audioEl.play().then(() => {
          console.log('[Realtime] Audio playback started');
        }).catch(err => {
          console.warn('[Realtime] Autoplay blocked, will retry:', err.message);
        });
      };

      // Add microphone track
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        console.log('[Realtime] Data channel opened - waiting for session.created before greeting');
        // Don't send session.update - edge function already configured everything
        // Don't send response.create yet - wait for session.created event
      };

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Log full data for debugging key events
          if (msg.type === 'response.done' || msg.type === 'conversation.item.input_audio_transcription.failed' || msg.type === 'error') {
            console.log('[Realtime] FULL EVENT:', JSON.stringify(msg).slice(0, 500));
          } else {
            console.log('[Realtime] Event received:', msg.type);
          }
          
          // When session is created, send a conversation item + response.create for greeting
          if (msg.type === 'session.created') {
            console.log('[Realtime] Session created - sending greeting via conversation item');
            
            const greetingText = language === 'ne' 
              ? 'नमस्ते भन्नुहोस् र आफूलाई कृषि मित्र भनेर चिनाउनुहोस्।'
              : language === 'hi'
              ? 'नमस्ते कहें और अपना परिचय कृषि मित्र के रूप में दें।'
              : 'Say hello and introduce yourself as Krishi Mitra.';
            
            // First add a conversation item
            dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: greetingText }]
              }
            }));
            
            // Then request a response
            dc.send(JSON.stringify({ type: 'response.create' }));
            console.log('[Realtime] Greeting conversation item + response.create sent');
          }
          
          handleRealtimeEvent(msg);
        } catch (e) {
          console.error('[Realtime] Parse error:', e);
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      });

      if (!response.ok) {
        throw new Error('Failed to connect to OpenAI Realtime');
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

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
      console.error('[Realtime] Connection error:', error);
      setStatus('error');
      toast({
        title: language === 'ne' ? 'जडान असफल' : 'Connection Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
      disconnect();
    }
  }, [language, toast]);

  const disconnect = useCallback(() => {
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
      audioElRef.current.remove(); // Remove from DOM
      audioElRef.current = null;
    }

    setStatus('disconnected');
    setIsSpeaking(false);
  }, []);

  const handleRealtimeEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        setAiResponse(prev => prev + (event.delta || ''));
        break;
      case 'response.audio_transcript.done':
        // Response complete
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
      case 'response.done':
        console.log('[Realtime] Response done - output items:', JSON.stringify(event.response?.output || []).slice(0, 300));
        break;
      case 'conversation.item.input_audio_transcription.failed':
        console.error('[Realtime] Transcription FAILED:', JSON.stringify(event.error || event));
        break;
      case 'error':
        console.error('[Realtime] Error event:', event);
        toast({
          title: 'Error',
          description: event.error?.message || 'An error occurred',
          variant: 'destructive'
        });
        break;
    }
  }, [toast]);

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
          </h2>
          
          {status === 'disconnected' && (
            <p className="text-sm text-muted-foreground">
              {language === 'ne' 
                ? 'AI सँग नेपालीमा सिधै बोल्नुहोस्' 
                : 'Talk directly with AI in your language'}
            </p>
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
          {status === 'disconnected' || status === 'error' ? (
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
