import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, User, Shield, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateImageNote, type TicketImage } from '@/hooks/useTicketImages';
import { useToast } from '@/hooks/use-toast';

interface TicketImageViewerProps {
  images: TicketImage[];
  initialIndex: number;
  onClose: () => void;
  canEditNotes?: boolean;
}

export function TicketImageViewer({ images, initialIndex, onClose, canEditNotes = false }: TicketImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [editingNote, setEditingNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const updateNote = useUpdateImageNote();
  const { toast } = useToast();

  const current = images[index];

  useEffect(() => {
    setZoom(1);
    setEditingNote(current?.note || '');
    setIsEditing(false);
  }, [index, current?.note]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) setIndex(i => i + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, images.length, onClose]);

  const handleSaveNote = () => {
    updateNote.mutate(
      { imageId: current.id, note: editingNote.trim(), ticketId: current.ticket_id },
      {
        onSuccess: () => {
          toast({ title: 'टिप्पणी सुरक्षित भयो' });
          setIsEditing(false);
        },
      }
    );
  };

  return (
    // Multi-photo ticket images viewer start
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 text-white" onClick={e => e.stopPropagation()}>
        <span className="text-sm font-medium">
          {index + 1} / {images.length}
          <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
            current.role === 'technician' ? 'bg-blue-600/80' : 'bg-primary/80'
          }`}>
            {current.role === 'technician' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {current.role === 'technician' ? 'Bigya' : 'Farmer'}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-auto" onClick={e => e.stopPropagation()}>
        {index > 0 && (
          <button className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" onClick={() => setIndex(i => i - 1)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <img
          src={current.image_url}
          alt={`Photo ${index + 1}`}
          className="max-w-full max-h-[60vh] object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          draggable={false}
        />
        {index < images.length - 1 && (
          <button className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" onClick={() => setIndex(i => i + 1)}>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Note area */}
      <div className="p-3 bg-black/70 text-white" onClick={e => e.stopPropagation()}>
        {canEditNotes ? (
          <div className="max-w-2xl mx-auto space-y-2">
            <label className="text-xs text-white/70">Bigya टिप्पणी:</label>
            {isEditing ? (
              <div className="flex gap-2">
                <Textarea
                  value={editingNote}
                  onChange={e => setEditingNote(e.target.value)}
                  placeholder="यो फोटोमा के देखिन्छ लेख्नुहोस्..."
                  rows={2}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm resize-none flex-1"
                />
                <Button size="sm" onClick={handleSaveNote} disabled={updateNote.isPending} className="self-end">
                  {updateNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            ) : (
              <div
                className="text-sm cursor-pointer hover:bg-white/10 rounded p-2 min-h-[2rem]"
                onClick={() => setIsEditing(true)}
              >
                {current.note || <span className="text-white/40 italic">टिप्पणी थप्नुहोस्...</span>}
              </div>
            )}
          </div>
        ) : (
          current.note && (
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-white/70 mb-1">Bigya टिप्पणी:</p>
              <p className="text-sm">{current.note}</p>
            </div>
          )
        )}
      </div>
    </div>
    // Multi-photo ticket images viewer end
  );
}
