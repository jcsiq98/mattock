import { useState, useRef, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  CheckIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline';

// Types for annotation tools and shapes
type Tool = 'pen' | 'arrow' | 'circle';
type StrokeWidth = 'thin' | 'medium' | 'thick';

interface Point {
  x: number;
  y: number;
}

interface BaseShape {
  id: string;
  color: string;
  strokeWidth: number;
}

interface PenShape extends BaseShape {
  type: 'pen';
  points: Point[];
}

interface ArrowShape extends BaseShape {
  type: 'arrow';
  start: Point;
  end: Point;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  center: Point;
  radiusX: number;
  radiusY: number;
}

type Shape = PenShape | ArrowShape | CircleShape;

interface AnnotationEditorProps {
  imageData: string;
  onSave: (annotatedImageData: string) => void;
  onCancel: () => void;
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Black', value: '#000000' },
];

const STROKE_WIDTHS: { name: StrokeWidth; value: number }[] = [
  { name: 'thin', value: 2 },
  { name: 'medium', value: 4 },
  { name: 'thick', value: 8 },
];

export function AnnotationEditor({ imageData, onSave, onCancel }: AnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState<StrokeWidth>('medium');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get stroke width value
  const getStrokeValue = () => STROKE_WIDTHS.find(s => s.name === strokeWidth)?.value || 4;

  // Load image and set canvas size
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      
      // Calculate canvas size to fit container while maintaining aspect ratio
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const imgAspect = img.width / img.height;
        const containerAspect = containerWidth / containerHeight;
        
        let width, height;
        if (imgAspect > containerAspect) {
          width = containerWidth;
          height = containerWidth / imgAspect;
        } else {
          height = containerHeight;
          width = containerHeight * imgAspect;
        }
        
        setCanvasSize({ width, height });
        setImageLoaded(true);
      }
    };
    img.src = imageData;
  }, [imageData]);

  // Draw everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw all shapes
    [...shapes, currentShape].filter(Boolean).forEach(shape => {
      if (!shape) return;
      
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      switch (shape.type) {
        case 'pen':
          drawPen(ctx, shape);
          break;
        case 'arrow':
          drawArrow(ctx, shape);
          break;
        case 'circle':
          drawCircle(ctx, shape);
          break;
      }
    });
  }, [shapes, currentShape]);

  // Redraw when shapes change
  useEffect(() => {
    if (imageLoaded) {
      draw();
    }
  }, [imageLoaded, draw]);

  // Draw pen strokes
  function drawPen(ctx: CanvasRenderingContext2D, shape: PenShape) {
    if (shape.points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    
    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y);
    }
    
    ctx.stroke();
  }

  // Draw arrow
  function drawArrow(ctx: CanvasRenderingContext2D, shape: ArrowShape) {
    const { start, end } = shape;
    const headLength = Math.max(15, shape.strokeWidth * 4);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  // Draw circle/ellipse
  function drawCircle(ctx: CanvasRenderingContext2D, shape: CircleShape) {
    ctx.beginPath();
    ctx.ellipse(
      shape.center.x,
      shape.center.y,
      Math.abs(shape.radiusX),
      Math.abs(shape.radiusY),
      0,
      0,
      2 * Math.PI
    );
    ctx.stroke();
  }

  // Get point from event (touch or mouse)
  function getPoint(e: React.TouchEvent | React.MouseEvent): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  }

  // Start drawing
  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const point = getPoint(e);
    setIsDrawing(true);
    
    const baseShape: BaseShape = {
      id: crypto.randomUUID(),
      color,
      strokeWidth: getStrokeValue(),
    };
    
    switch (tool) {
      case 'pen':
        setCurrentShape({
          ...baseShape,
          type: 'pen',
          points: [point],
        });
        break;
      case 'arrow':
        setCurrentShape({
          ...baseShape,
          type: 'arrow',
          start: point,
          end: point,
        });
        break;
      case 'circle':
        setCurrentShape({
          ...baseShape,
          type: 'circle',
          center: point,
          radiusX: 0,
          radiusY: 0,
        });
        break;
    }
  }

  // Continue drawing
  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDrawing || !currentShape) return;
    e.preventDefault();
    
    const point = getPoint(e);
    
    switch (currentShape.type) {
      case 'pen':
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, point],
        });
        break;
      case 'arrow':
        setCurrentShape({
          ...currentShape,
          end: point,
        });
        break;
      case 'circle':
        const dx = point.x - currentShape.center.x;
        const dy = point.y - currentShape.center.y;
        setCurrentShape({
          ...currentShape,
          radiusX: Math.abs(dx),
          radiusY: Math.abs(dy),
        });
        break;
    }
  }

  // End drawing
  function handleEnd(e: React.TouchEvent | React.MouseEvent) {
    if (!isDrawing || !currentShape) return;
    e.preventDefault();
    
    // Only add shape if it has meaningful size
    let shouldAdd = true;
    if (currentShape.type === 'pen' && currentShape.points.length < 2) {
      shouldAdd = false;
    } else if (currentShape.type === 'arrow') {
      const dx = currentShape.end.x - currentShape.start.x;
      const dy = currentShape.end.y - currentShape.start.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) shouldAdd = false;
    } else if (currentShape.type === 'circle') {
      if (currentShape.radiusX < 5 && currentShape.radiusY < 5) shouldAdd = false;
    }
    
    if (shouldAdd) {
      setShapes(prev => [...prev, currentShape]);
    }
    
    setCurrentShape(null);
    setIsDrawing(false);
  }

  // Undo last shape
  function handleUndo() {
    setShapes(prev => prev.slice(0, -1));
  }

  // Clear all shapes
  function handleClear() {
    setShapes([]);
  }

  // Save annotated image
  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setSaving(true);
    
    try {
      // Get the annotated image as data URL
      const annotatedImageData = canvas.toDataURL('image/jpeg', 0.9);
      onSave(annotatedImageData);
    } catch (error) {
      console.error('Failed to save annotation:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/90">
        <button
          onClick={onCancel}
          className="text-white p-2 rounded-full hover:bg-white/20"
          aria-label="Cancel"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <span className="text-white font-medium">Annotate Photo</span>
        
        <button
          onClick={handleSave}
          disabled={saving || shapes.length === 0}
          className="text-white p-2 rounded-full hover:bg-white/20 disabled:opacity-50"
          aria-label="Save"
        >
          {saving ? (
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <CheckIcon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-black p-2"
      >
        {imageLoaded ? (
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="touch-none"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              borderRadius: '8px',
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        ) : (
          <div className="text-white">Loading image...</div>
        )}
      </div>

      {/* Tool Bar */}
      <div className="bg-black/90 p-3 space-y-3">
        {/* Tools */}
        <div className="flex items-center justify-center gap-2">
          <ToolButton
            active={tool === 'pen'}
            onClick={() => setTool('pen')}
            label="Pen"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
            </svg>
          </ToolButton>
          
          <ToolButton
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
            label="Arrow"
          >
            <ArrowLongRightIcon className="w-6 h-6" />
          </ToolButton>
          
          <ToolButton
            active={tool === 'circle'}
            onClick={() => setTool('circle')}
            label="Circle"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </ToolButton>
          
          <div className="w-px h-8 bg-white/20 mx-2" />
          
          <button
            onClick={handleUndo}
            disabled={shapes.length === 0}
            className="p-3 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Undo"
          >
            <ArrowUturnLeftIcon className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleClear}
            disabled={shapes.length === 0}
            className="p-3 rounded-full text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Clear all"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center justify-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c.value ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            />
          ))}
          
          <div className="w-px h-8 bg-white/20 mx-2" />
          
          {/* Stroke Width */}
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw.name}
              onClick={() => setStrokeWidth(sw.name)}
              className={`p-2 rounded-full transition-all ${
                strokeWidth === sw.name ? 'bg-white/30' : 'hover:bg-white/20'
              }`}
              aria-label={`${sw.name} stroke`}
            >
              <div
                className="rounded-full bg-white"
                style={{
                  width: sw.value * 2 + 4,
                  height: sw.value * 2 + 4,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tool Button Component
interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}

function ToolButton({ active, onClick, label, children }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-all ${
        active ? 'bg-primary-500 text-white' : 'text-white hover:bg-white/20'
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

