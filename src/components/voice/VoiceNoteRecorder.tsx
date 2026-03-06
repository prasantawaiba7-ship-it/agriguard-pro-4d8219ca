import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, X, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVoiceNoteRecorder, VoiceNoteState } from '@/hooks/useVoiceNoteRecorder';

interface VoiceNoteRecorderProps {
  onSend: (audioUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const {
    state, duration, error, maxDuration,
    startRecording, stopRecording, cancelRecording, uploadVoiceNote, reset,
  } = useVoiceNoteRecorder();

  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = async () => {
    setHasStarted(true);
    await startRecording();
  };

  const handleStopAndSend = async () => {
    const blob = await stopRecording();
    if (!blob) return;
    const url = await uploadVoiceNote(blob);
    if (url) {
      onSend(url, duration);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  const handleRetry = () => {
    reset();
    setHasStarted(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-background border-t-2 border-primary/30 rounded-t-2xl shadow-2xl p-4 pb-6 safe-area-bottom"
      >
        {/* Consent notice on first open */}
        {!hasStarted && state === 'idle' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">🎤 आवाज सन्देश (Voice Note)</p>
              <p>• तपाईंको आवाज खेती समस्या बुझ्नका लागि मात्र प्रयोग हुनेछ।</p>
              <p>• कृषि विज्ञले यो सुन्न सक्नुहुनेछ।</p>
              <p className="text-[10px] italic">Your voice is used only to understand your farming problem. Experts may listen to it.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" /> रद्द
              </Button>
              <Button className="flex-1" onClick={handleStart}>
                <Mic className="w-4 h-4 mr-1" /> रेकर्ड सुरु (Record)
              </Button>
            </div>
          </div>
        )}

        {/* Recording state */}
        {state === 'recording' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-4 h-4 rounded-full bg-destructive"
              />
              <span className="text-2xl font-mono font-bold text-foreground">
                {formatTime(duration)}
              </span>
              <span className="text-xs text-muted-foreground">/ {formatTime(maxDuration)}</span>
            </div>
            <Progress value={(duration / maxDuration) * 100} className="h-1.5" />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" /> रद्द (Cancel)
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleStopAndSend}>
                <Send className="w-4 h-4 mr-1" /> पठाउनुहोस् (Send)
              </Button>
            </div>
          </div>
        )}

        {/* Sending state */}
        {state === 'sending' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">पठाउँदैछ... (Sending...)</p>
          </div>
        )}

        {/* Failed state */}
        {state === 'failed' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{error || 'पठाउन सकिएन।'}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="w-4 h-4 mr-1" /> रद्द
              </Button>
              <Button className="flex-1" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-1" /> पुन: प्रयास (Retry)
              </Button>
            </div>
          </div>
        )}

        {/* Mic permission error */}
        {state === 'idle' && hasStarted && error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <Button variant="outline" className="w-full" onClick={handleCancel}>
              बन्द गर्नुहोस्
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
