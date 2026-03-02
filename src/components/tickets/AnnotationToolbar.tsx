// Image annotation start
import { Circle, ArrowRight, Pen, Bug, Leaf, AlertTriangle, Eraser, Undo2, Save, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AnnotationTool = 'circle' | 'arrow' | 'pen' | 'stamp';
export type StampIcon = 'bug' | 'leaf' | 'warning';
export type AnnotationColor = '#ef4444' | '#eab308' | '#22c55e';

/**
 * Annotation shape stored in expert_ticket_images.annotation_data
 *
 * Supported shapes:
 * - circle: { type:'circle', x, y, radius, color, label? }
 * - arrow:  { type:'arrow', fromX, fromY, toX, toY, color, label? }
 * - pen:    { type:'pen', points:[{x,y},...], color, label? }
 * - stamp:  { type:'stamp', icon:'bug'|'leaf'|'warning', x, y, color, label? }
 */
export interface AnnotationShape {
  type: 'circle' | 'arrow' | 'pen' | 'stamp';
  color: string;
  label?: string;
  // circle
  x?: number;
  y?: number;
  radius?: number;
  // arrow
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  // pen
  points?: { x: number; y: number }[];
  // stamp
  icon?: StampIcon;
}

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  activeColor: AnnotationColor;
  activeStamp: StampIcon;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: AnnotationColor) => void;
  onStampChange: (stamp: StampIcon) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  shapesCount: number;
}

const COLORS: { value: AnnotationColor; label: string }[] = [
  { value: '#ef4444', label: 'रातो' },
  { value: '#eab308', label: 'पहेंलो' },
  { value: '#22c55e', label: 'हरियो' },
];

const STAMPS: { value: StampIcon; icon: React.ReactNode; label: string }[] = [
  { value: 'bug', icon: <Bug className="w-4 h-4" />, label: 'कीरा' },
  { value: 'leaf', icon: <Leaf className="w-4 h-4" />, label: 'पात' },
  { value: 'warning', icon: <AlertTriangle className="w-4 h-4" />, label: 'चेतावनी' },
];

export function AnnotationToolbar({
  activeTool,
  activeColor,
  activeStamp,
  onToolChange,
  onColorChange,
  onStampChange,
  onUndo,
  onClearAll,
  onSave,
  onCancel,
  isSaving,
  shapesCount,
}: AnnotationToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-black/80 rounded-lg" onClick={e => e.stopPropagation()}>
      {/* Drawing tools */}
      <div className="flex gap-1 border-r border-white/20 pr-2">
        <ToolBtn active={activeTool === 'circle'} onClick={() => onToolChange('circle')} title="Circle">
          <Circle className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn active={activeTool === 'arrow'} onClick={() => onToolChange('arrow')} title="Arrow">
          <ArrowRight className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn active={activeTool === 'pen'} onClick={() => onToolChange('pen')} title="Pen">
          <Pen className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* Stamps */}
      <div className="flex gap-1 border-r border-white/20 pr-2">
        {STAMPS.map(s => (
          <ToolBtn
            key={s.value}
            active={activeTool === 'stamp' && activeStamp === s.value}
            onClick={() => { onToolChange('stamp'); onStampChange(s.value); }}
            title={s.label}
          >
            {s.icon}
          </ToolBtn>
        ))}
      </div>

      {/* Colors */}
      <div className="flex gap-1 border-r border-white/20 pr-2">
        {COLORS.map(c => (
          <button
            key={c.value}
            className={`w-6 h-6 rounded-full border-2 transition-all ${activeColor === c.value ? 'border-white scale-110' : 'border-white/30'}`}
            style={{ backgroundColor: c.value }}
            onClick={() => onColorChange(c.value)}
            title={c.label}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <ToolBtn onClick={onUndo} title="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn onClick={onClearAll} title="Clear all" disabled={shapesCount === 0}>
          <Trash2 className="w-4 h-4" />
        </ToolBtn>
      </div>

      <div className="flex gap-1 ml-auto">
        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-8 text-xs" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" /> रद्द
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={onSave} disabled={isSaving}>
          <Save className="w-3 h-3 mr-1" /> {isSaving ? 'सुरक्षित...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

function ToolBtn({ active, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`w-8 h-8 rounded flex items-center justify-center text-white transition-all ${
        active ? 'bg-white/30 ring-1 ring-white' : 'hover:bg-white/15'
      } disabled:opacity-30`}
      {...props}
    >
      {children}
    </button>
  );
}
// Image annotation end
