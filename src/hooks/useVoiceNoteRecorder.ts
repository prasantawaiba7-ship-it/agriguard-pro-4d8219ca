import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceNoteState = 'idle' | 'recording' | 'sending' | 'sent' | 'failed';

const MAX_DURATION_SECONDS = 60;

export function useVoiceNoteRecorder() {
  const [state, setState] = useState<VoiceNoteState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= MAX_DURATION_SECONDS - 1) {
            recorder.stop();
            return MAX_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError('माइक्रोफोन पहुँच अस्वीकृत।');
      setState('idle');
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        cleanup();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        resolve(blob);
      };
      recorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanup();
    setDuration(0);
    setState('idle');
  }, [cleanup]);

  const uploadVoiceNote = useCallback(async (blob: Blob): Promise<string | null> => {
    setState('sending');
    try {
      const ext = blob.type.includes('webm') ? 'webm' : 'ogg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, blob, { contentType: blob.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('voice-notes').getPublicUrl(fileName);
      setState('sent');
      return data.publicUrl;
    } catch (err) {
      console.error('Voice note upload failed:', err);
      setError('अपलोड असफल। पुन: प्रयास गर्नुहोस्।');
      setState('failed');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setError(null);
  }, [cleanup]);

  return {
    state,
    duration,
    error,
    maxDuration: MAX_DURATION_SECONDS,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadVoiceNote,
    reset,
  };
}
