// Image annotation start
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, User, Shield, Save, Loader2, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateImageNote, type TicketImage } from '@/hooks/useTicketImages';
import { useUpdateAnnotations } from '@/hooks/useImageAnnotations';
import { AnnotationToolbar, type AnnotationShape, type AnnotationTool, type AnnotationColor, type StampIcon } from './AnnotationToolbar';
import { AnnotationOverlay } from './AnnotationOverlay';
import { useToast } from '@/hooks/use-toast';

interface TicketImageViewerProps {
  images: TicketImage[];
  initialIndex: number;
  onClose: () => void;
  canEditNotes?: boolean;
  canAnnotate?: boolean;
}

const LEGEND: Record<string, string> = {
  circle: 'रोग लागेको भाग',
  arrow: 'दिशा / जडान',
  bug: 'कीरा आक्रमण',
  leaf: 'पात समस्या',
  warning: 'चेतावनी',
};

const MAX_SHAPES = 30;

export function TicketImageViewer({ images, initialIndex, onClose, canEditNotes = false, canAnnotate = false }: TicketImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [editingNote, setEditingNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const updateNote = useUpdateImageNote();
  const updateAnnotations = useUpdateAnnotations();
  const { toast } = useToast();

  // Annotation state
  const [annotateMode, setAnnotateMode] = useState(false);
  const [shapes, setShapes] = useState<AnnotationShape[]>([]);
  const [savedShapes, setSavedShapes] = useState<AnnotationShape[]>([]);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('circle');
  const [activeColor, setActiveColor] = useState<AnnotationColor>('#ef4444');
  const [activeStamp, setActiveStamp] = useState<StampIcon>('bug');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const current = images[index];

  useEffect(() => {
    setZoom(1);
    setEditingNote(current?.note || '');
    setIsEditing(false);
    setAnnotateMode(false);
    const parsed = (current?.annotation_data as AnnotationShape[] | null) || [];
    setShapes(parsed);
    setSavedShapes(parsed);
  }, [index, current?.note, current?.annotation_data]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (annotateMode) return; // disable nav in annotate mode
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) setIndex(i => i + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, images.length, onClose, annotateMode]);

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

  const handleAddShape = (shape: AnnotationShape) => {
    if (shapes.length >= MAX_SHAPES) {
      toast({ title: `बढीमा ${MAX_SHAPES} annotations मात्र`, variant: 'destructive' });
      return;
    }
    setShapes(prev => [...prev, shape]);
  };

  const handleUndo = () => setShapes(prev => prev.slice(0, -1));
  const handleClearAll = () => {
    if (confirm('सबै annotations हटाउने?')) setShapes([]);
  };

  const handleSaveAnnotations = () => {
    updateAnnotations.mutate(
      { imageId: current.id, annotations: shapes, ticketId: current.ticket_id },
      {
        onSuccess: () => {
          toast({ title: 'Annotations सुरक्षित भयो' });
          setSavedShapes(shapes);
          setAnnotateMode(false);
        },
      }
    );
  };

  const handleCancelAnnotate = () => {
    setShapes(savedShapes);
    setAnnotateMode(false);
  };

  const handleImgLoad = () => {
    if (imgRef.current) {
      setImgSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  };

  // Steps list: shapes with labels
  const labeledShapes = shapes.map((s, i) => ({ ...s, _idx: i })).filter(s => s.label);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={annotateMode ? undefined : onClose}>
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
          {canAnnotate && !annotateMode && (
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs" onClick={() => setAnnotateMode(true)}>
              <PenTool className="w-4 h-4 mr-1" /> Annotate
            </Button>
          )}
          {!annotateMode && (
            <>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Annotation toolbar */}
      {annotateMode && (
        <div className="px-3 pb-2" onClick={e => e.stopPropagation()}>
          <AnnotationToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            activeStamp={activeStamp}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            onStampChange={setActiveStamp}
            onUndo={handleUndo}
            onClearAll={handleClearAll}
            onSave={handleSaveAnnotations}
            onCancel={handleCancelAnnotate}
            isSaving={updateAnnotations.isPending}
            shapesCount={shapes.length}
          />
        </div>
      )}

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-auto" onClick={e => e.stopPropagation()}>
        {!annotateMode && index > 0 && (
          <button className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" onClick={() => setIndex(i => i - 1)}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative inline-block" style={{ transform: annotateMode ? undefined : `scale(${zoom})`, transition: 'transform 0.2s' }}>
          <img
            ref={imgRef}
            src={current.image_url}
            alt={`Photo ${index + 1}`}
            className="max-w-full max-h-[60vh] object-contain"
            draggable={false}
            onLoad={handleImgLoad}
          />
          {/* Annotation SVG overlay */}
          <AnnotationOverlay
            shapes={shapes}
            editable={annotateMode}
            activeTool={activeTool}
            activeColor={activeColor}
            activeStamp={activeStamp}
            onAddShape={handleAddShape}
            imageWidth={imgSize.w}
            imageHeight={imgSize.h}
            highlightIndex={highlightIdx}
          />
        </div>

        {!annotateMode && index < images.length - 1 && (
          <button className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70" onClick={() => setIndex(i => i + 1)}>
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom area: notes + steps legend */}
      <div className="p-3 bg-black/70 text-white max-h-[30vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Annotation legend for farmers (read-only) */}
        {!canAnnotate && shapes.length > 0 && (
          <div className="max-w-2xl mx-auto mb-2">
            <p className="text-xs text-white/70 mb-1">📍 चिन्हहरू:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(shapes.map(s => s.type === 'stamp' ? s.icon || s.type : s.type))).map(key => (
                <span key={key} className="text-[10px] bg-white/10 px-2 py-0.5 rounded">
                  {LEGEND[key!] || key}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Steps (labeled annotations) */}
        {labeledShapes.length > 0 && (
          <div className="max-w-2xl mx-auto mb-2">
            <p className="text-xs text-white/70 mb-1">📝 Steps:</p>
            <div className="space-y-1">
              {labeledShapes.map((s, i) => (
                <div
                  key={i}
                  className="text-xs bg-white/10 rounded px-2 py-1 cursor-pointer hover:bg-white/20 transition"
                  onClick={() => { setHighlightIdx(s._idx); setTimeout(() => setHighlightIdx(null), 1500); }}
                >
                  <span className="font-medium">Step {i + 1}:</span> {s.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note area */}
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
  );
}
// Image annotation end
