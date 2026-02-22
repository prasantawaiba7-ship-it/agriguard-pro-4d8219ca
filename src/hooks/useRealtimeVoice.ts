import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeVoiceOptions {
  language?: string;
  speed?: number;
  onMessage?: (message: { role: 'user' | 'assistant'; content: string }) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking') => void;
  onUserTranscript?: (transcript: string, isFinal: boolean) => void;
  onAiTranscript?: (transcript: string, isFinal: boolean) => void;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const { language = 'ne', speed = 1.0, onMessage, onError, onStatusChange, onUserTranscript, onAiTranscript } = options;
  
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const connect = useCallback(async () => {
    if (status !== 'disconnected') return;
    
    updateStatus('connecting');
    
    try {
      // Request microphone permission
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

      // Get ephemeral token from edge function with speed setting
      const { data, error } = await supabase.functions.invoke('realtime-token', {
        body: { language, speed }
      });

      if (error || !data?.client_secret?.value) {
        throw new Error(error?.message || 'Failed to get realtime token');
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Create audio element for playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      // Set up remote audio
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      pc.addTrack(stream.getTracks()[0]);

      // Set up data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        updateStatus('connected');
      });

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('Received event:', event.type);
          
          switch (event.type) {
            case 'response.audio.delta':
              setIsSpeaking(true);
              updateStatus('speaking');
              break;
              
            case 'response.audio.done':
              setIsSpeaking(false);
              updateStatus('connected');
              break;

            // Real-time user speech transcription (interim)
            case 'input_audio_buffer.speech_started':
              console.log('User started speaking');
              break;

            case 'input_audio_buffer.speech_stopped':
              console.log('User stopped speaking');
              break;
              
            // Completed user transcription
            case 'conversation.item.input_audio_transcription.completed':
              const userText = event.transcript;
              if (userText) {
                setTranscript(userText);
                onUserTranscript?.(userText, true);
                onMessage?.({ role: 'user', content: userText });
              }
              break;

            // Real-time AI response transcription (streaming)
            case 'response.audio_transcript.delta':
              const deltaText = event.delta;
              if (deltaText) {
                setAiResponseText(prev => prev + deltaText);
                onAiTranscript?.(deltaText, false);
              }
              break;
              
            case 'response.audio_transcript.done':
              const assistantText = event.transcript;
              if (assistantText) {
                setAiResponseText('');
                onAiTranscript?.(assistantText, true);
                onMessage?.({ role: 'assistant', content: assistantText });
              }
              break;
              
            case 'error':
              console.error('Realtime API error:', event.error);
              onError?.(event.error?.message || 'Realtime API error');
              break;
          }
        } catch (err) {
          console.error('Error parsing event:', err);
        }
      });

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      
      await pc.setRemoteDescription(answer);
      console.log('WebRTC connection established');

    } catch (error) {
      console.error('Error connecting:', error);
      updateStatus('disconnected');
      onError?.(error instanceof Error ? error.message : 'Failed to connect');
      disconnect();
    }
  }, [status, language, onMessage, onError, updateStatus]);

  const disconnect = useCallback(() => {
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
      audioElRef.current.srcObject = null;
      audioElRef.current = null;
    }
    
    setIsSpeaking(false);
    setTranscript('');
    setAiResponseText('');
    updateStatus('disconnected');
  }, [updateStatus]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      onError?.('Not connected');
      return;
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    dcRef.current.send(JSON.stringify(event));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, [onError]);

  return {
    status,
    isSpeaking,
    transcript,
    aiResponseText,
    connect,
    disconnect,
    sendTextMessage,
    isConnected: status === 'connected' || status === 'speaking'
  };
}
