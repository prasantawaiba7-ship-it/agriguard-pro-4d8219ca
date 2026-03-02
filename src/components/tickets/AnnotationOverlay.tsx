// Image annotation start
import { useState, useRef, useCallback, useEffect } from 'react';
import { Bug, Leaf, AlertTriangle } from 'lucide-react';
import type { AnnotationShape, AnnotationTool, AnnotationColor, StampIcon } from './AnnotationToolbar';

interface AnnotationOverlayProps {
  shapes: AnnotationShape[];
  editable: boolean;
  activeTool: AnnotationTool;
  activeColor: AnnotationColor;
  activeStamp: StampIcon;
  onAddShape: (shape: AnnotationShape) => void;
  imageWidth: number;
  imageHeight: number;
  highlightIndex?: number | null;
}

/**
 * SVG overlay for drawing and displaying annotations on top of a ticket image.
 * Coordinates are stored as percentages (0–100) of image dimensions for resolution independence.
 */
export function AnnotationOverlay({
  shapes,
  editable,
  activeTool,
  activeColor,
  activeStamp,
  onAddShape,
  imageWidth,
  imageHeight,
  highlightIndex,
}: AnnotationOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const t = e.touches[0] || (e as any).changedTouches[0];
      return { clientX: t.clientX, clientY: t.clientY };
    }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!editable) return;
    e.preventDefault();
    const pos = toPercent(getEventPos(e).clientX, getEventPos(e).clientY);

    if (activeTool === 'stamp') {
      onAddShape({ type: 'stamp', icon: activeStamp, x: pos.x, y: pos.y, color: activeColor });
      return;
    }

    setDrawing(true);
    setStart(pos);
    setCurrent(pos);
    if (activeTool === 'pen') {
      setPenPoints([pos]);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !editable) return;
    e.preventDefault();
    const pos = toPercent(getEventPos(e).clientX, getEventPos(e).clientY);
    setCurrent(pos);
    if (activeTool === 'pen') {
      setPenPoints(prev => [...prev, pos]);
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !start) return;
    e.preventDefault();
    const pos = toPercent(getEventPos(e).clientX, getEventPos(e).clientY);

    if (activeTool === 'circle') {
      const dx = pos.x - start.x;
      const dy = pos.y - start.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      if (radius > 1) {
        onAddShape({ type: 'circle', x: start.x, y: start.y, radius, color: activeColor });
      }
    } else if (activeTool === 'arrow') {
      const dist = Math.sqrt((pos.x - start.x) ** 2 + (pos.y - start.y) ** 2);
      if (dist > 2) {
        onAddShape({ type: 'arrow', fromX: start.x, fromY: start.y, toX: pos.x, toY: pos.y, color: activeColor });
      }
    } else if (activeTool === 'pen' && penPoints.length > 2) {
      onAddShape({ type: 'pen', points: penPoints, color: activeColor });
    }

    setDrawing(false);
    setStart(null);
    setCurrent(null);
    setPenPoints([]);
  };

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full ${editable ? 'cursor-crosshair' : 'pointer-events-none'}`}
      viewBox={`0 0 100 100`}
      preserveAspectRatio="none"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>

      {/* Existing shapes */}
      {shapes.map((shape, i) => (
        <g key={i} className={highlightIndex === i ? 'animate-pulse' : ''}>
          <ShapeRenderer shape={shape} />
        </g>
      ))}

      {/* Preview while drawing */}
      {drawing && start && current && (
        <PreviewShape tool={activeTool} start={start} current={current} penPoints={penPoints} color={activeColor} />
      )}
    </svg>
  );
}

function ShapeRenderer({ shape }: { shape: AnnotationShape }) {
  switch (shape.type) {
    case 'circle':
      return (
        <>
          <circle
            cx={shape.x}
            cy={shape.y}
            r={shape.radius}
            fill="none"
            stroke={shape.color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke' } as any}
          />
          {shape.label && (
            <text x={shape.x} y={(shape.y || 0) - (shape.radius || 0) - 1} fill={shape.color} fontSize="3" textAnchor="middle" fontWeight="bold">
              {shape.label}
            </text>
          )}
        </>
      );
    case 'arrow':
      return (
        <>
          <line
            x1={shape.fromX}
            y1={shape.fromY}
            x2={shape.toX}
            y2={shape.toY}
            stroke={shape.color}
            strokeWidth="0.5"
            markerEnd="url(#arrowhead)"
            style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke', color: shape.color } as any}
          />
          {shape.label && (
            <text x={shape.toX} y={(shape.toY || 0) - 1.5} fill={shape.color} fontSize="3" textAnchor="middle" fontWeight="bold">
              {shape.label}
            </text>
          )}
        </>
      );
    case 'pen':
      if (!shape.points || shape.points.length < 2) return null;
      const d = shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return <path d={d} fill="none" stroke={shape.color} strokeWidth="0.5" strokeLinecap="round" style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke' } as any} />;
    case 'stamp':
      return (
        <g transform={`translate(${(shape.x || 0) - 2.5}, ${(shape.y || 0) - 2.5})`}>
          <circle cx="2.5" cy="2.5" r="3" fill={shape.color} opacity="0.3" />
          <text x="2.5" y="3.5" textAnchor="middle" fontSize="4" fill={shape.color}>
            {shape.icon === 'bug' ? '🐛' : shape.icon === 'leaf' ? '🍃' : '⚠️'}
          </text>
          {shape.label && (
            <text x="2.5" y="-1" fill={shape.color} fontSize="2.5" textAnchor="middle" fontWeight="bold">
              {shape.label}
            </text>
          )}
        </g>
      );
    default:
      return null;
  }
}

function PreviewShape({ tool, start, current, penPoints, color }: {
  tool: AnnotationTool; start: { x: number; y: number }; current: { x: number; y: number };
  penPoints: { x: number; y: number }[]; color: string;
}) {
  if (tool === 'circle') {
    const r = Math.sqrt((current.x - start.x) ** 2 + (current.y - start.y) ** 2);
    return <circle cx={start.x} cy={start.y} r={r} fill="none" stroke={color} strokeWidth="0.5" strokeDasharray="1" opacity="0.7" style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke' } as any} />;
  }
  if (tool === 'arrow') {
    return <line x1={start.x} y1={start.y} x2={current.x} y2={current.y} stroke={color} strokeWidth="0.5" strokeDasharray="1" opacity="0.7" style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke' } as any} />;
  }
  if (tool === 'pen' && penPoints.length > 1) {
    const d = penPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth="0.5" opacity="0.7" style={{ strokeWidth: 2, vectorEffect: 'non-scaling-stroke' } as any} />;
  }
  return null;
}
// Image annotation end
