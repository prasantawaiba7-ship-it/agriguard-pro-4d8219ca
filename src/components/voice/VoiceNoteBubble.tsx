import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceNoteBubbleProps {
  audioUrl: string;
  durationSeconds: number;
  transcriptText?: string | null;
  senderLabel?: string;
  compact?: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceNoteBubble({ audioUrl, durationSeconds, transcriptText, senderLabel, compact = false }: VoiceNoteBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    return () => {
      audio.pause();
      audio.src = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioUrl]);

  const updateProgress = () => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const dur = audio.duration || durationSeconds;
      setProgress((audio.currentTime / dur) * 100);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }).catch(() => setIsPlaying(false));
    }
  };

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-2 ${compact ? 'p-1.5' : 'p-2'} rounded-lg bg-primary/5 border border-primary/15`}>
        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 ${compact ? 'h-7 w-7' : 'h-8 w-8'} rounded-full bg-primary/10 hover:bg-primary/20`}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          {/* Waveform-like progress bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary/60 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <span className={`shrink-0 font-mono ${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
          {formatTime(durationSeconds)}
        </span>

        {!compact && (
          <a href={audioUrl} download className="shrink-0">
            <Download className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </a>
        )}
      </div>

      {/* Voice note label */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Mic className="w-2.5 h-2.5" />
        <span>{senderLabel ? `${senderLabel} · ` : ''}आवाज सन्देश</span>
      </div>

      {/* Transcript */}
      {transcriptText && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTranscript ? 'लुकाउनुहोस्' : 'पूरा पाठ हेर्नुहोस् (See text)'}
          </button>
          {showTranscript && (
            <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-primary/20 italic">
              {transcriptText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
