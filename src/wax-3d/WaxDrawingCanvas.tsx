import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { MIAO_PATTERNS, type MiaoPattern } from "./WaxPatternDefinitions";
import { waxAudio } from "./WaxAudio";

interface WaxDrawingCanvasProps {
  onStrokeAdd: (strokeCount: number, coverageRatio: number) => void;
  onCanvasTextureUpdate?: (canvas: HTMLCanvasElement) => void;
  selectedTemplateId?: string;
  onSelectTemplate?: (id: string) => void;
}

export function WaxDrawingCanvas({
  onStrokeAdd,
  onCanvasTextureUpdate,
  selectedTemplateId = "butterfly",
  onSelectTemplate,
}: WaxDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState<number>(10);
  const [strokeCount, setStrokeCount] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [guideOpacity, setGuideOpacity] = useState<number>(0.75); // 0, 0.4, 0.75, 1.0
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<ImageData[]>([]);

  const activePattern =
    MIAO_PATTERNS.find((t) => t.id === selectedTemplateId) ||
    MIAO_PATTERNS[0];

  // Render guide pattern onto guide canvas
  const renderGuide = useCallback(() => {
    const gCanvas = guideCanvasRef.current;
    if (!gCanvas) return;
    const gCtx = gCanvas.getContext("2d");
    if (!gCtx) return;

    gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    if (guideOpacity <= 0) return;

    gCtx.save();
    gCtx.globalAlpha = guideOpacity;
    gCtx.strokeStyle = "#1d4766";
    gCtx.fillStyle = "#1d4766";
    gCtx.lineWidth = 2.4;
    gCtx.lineCap = "round";
    gCtx.lineJoin = "round";

    // Draw active pattern vector path
    activePattern.draw(gCtx, gCanvas.width, gCanvas.height);
    gCtx.restore();
  }, [activePattern, guideOpacity]);

  useEffect(() => {
    renderGuide();
  }, [renderGuide]);

  // Initialize main drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Base cotton color
    ctx.fillStyle = "#eee5d4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fine cotton weave texture
    ctx.fillStyle = "rgba(160, 140, 110, 0.07)";
    for (let x = 0; x < canvas.width; x += 3) {
      ctx.fillRect(x, 0, 1, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    onCanvasTextureUpdate?.(canvas);
  }, []);

  const getCanvasCoords = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const calculateCoverage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let paintedPixels = 0;
    const step = 16;
    const totalSampled = (width * height) / step;
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 210 || g < 190 || b < 160) {
        paintedPixels++;
      }
    }
    const ratio = Math.min(100, Math.round((paintedPixels / totalSampled) * 100 * 2.8));
    setCoverage(ratio);
    return ratio;
  };

  const drawWaxLine = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    width: number
  ) => {
    ctx.save();
    // 1. Outer translucent wax halo (hot wax fiber bleed)
    ctx.strokeStyle = "rgba(160, 95, 30, 0.32)";
    ctx.lineWidth = width * 1.35;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // 2. Main amber liquid wax body
    ctx.strokeStyle = "#9c581a";
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // 3. Inner golden glossy core
    ctx.strokeStyle = "rgba(242, 180, 70, 0.7)";
    ctx.lineWidth = Math.max(2, width * 0.4);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getCanvasCoords(e);
    lastPoint.current = point;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawWaxLine(ctx, point, { x: point.x + 0.1, y: point.y + 0.1 }, lineWidth);
    waxAudio.playDrawStroke();

    const newCount = strokeCount + 1;
    setStrokeCount(newCount);
    const newCov = calculateCoverage(ctx, canvas.width, canvas.height);
    onStrokeAdd(newCount, newCov);
    onCanvasTextureUpdate?.(canvas);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPoint = getCanvasCoords(e);
    const dist = Math.hypot(
      currentPoint.x - lastPoint.current.x,
      currentPoint.y - lastPoint.current.y
    );

    if (dist > 2.5) {
      drawWaxLine(ctx, lastPoint.current, currentPoint, lineWidth);
      lastPoint.current = currentPoint;

      if (Math.random() < 0.22) {
        waxAudio.playDrawStroke();
      }
      onCanvasTextureUpdate?.(canvas);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newCov = calculateCoverage(ctx, canvas.width, canvas.height);
    onStrokeAdd(strokeCount, newCov);

    if (historyRef.current.length > 25) {
      historyRef.current.shift();
    }
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    onCanvasTextureUpdate?.(canvas);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#eee5d4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(160, 140, 110, 0.07)";
    for (let x = 0; x < canvas.width; x += 3) {
      ctx.fillRect(x, 0, 1, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    setStrokeCount(0);
    setCoverage(0);
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    onStrokeAdd(0, 0);
    onCanvasTextureUpdate?.(canvas);
    waxAudio.playClothRustle();
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    const canvas = canvasRef.current;
    if (!canvas || !prev) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(prev, 0, 0);
    const newCount = Math.max(0, strokeCount - 1);
    setStrokeCount(newCount);
    const newCov = calculateCoverage(ctx, canvas.width, canvas.height);
    onStrokeAdd(newCount, newCov);
    onCanvasTextureUpdate?.(canvas);
  };

  return (
    <div className="wax-draw-panel in-map-draw-panel">
      {/* 12 Traditional Miao Patterns Horizontal Scroll Strip */}
      <div className="pattern-selector">
        <div className="pattern-header-row">
          <span className="pattern-label">苗族传统非遗纹样（点击切换临摹底稿）：</span>
          <span className="pattern-count">共 12 款经典纹样</span>
        </div>
        <div className="pattern-chips">
          {MIAO_PATTERNS.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className={`pattern-chip ${tmpl.id === selectedTemplateId ? "is-selected" : ""}`}
              onClick={() => {
                onSelectTemplate?.(tmpl.id);
                waxAudio.playWaxScrape();
              }}
            >
              <span>{tmpl.symbol}</span>
              <b>{tmpl.name}</b>
              <small>{tmpl.difficulty}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="pattern-desc">
        <p>
          <b>{activePattern.symbol} {activePattern.name}</b>
          <span className="pattern-subname">（{activePattern.subname}）</span>：
          {activePattern.meaning}
        </p>
      </div>

      {/* Main Tracing Canvas Container with High-Contrast Guide Layer */}
      <div className="cloth-canvas-wrapper">
        {/* Layer 1: Base drawing canvas where wax is applied */}
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="wax-interactive-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Layer 2: High-contrast semi-transparent guide overlay on top for easy tracing */}
        <canvas
          ref={guideCanvasRef}
          width={640}
          height={640}
          className="canvas-guide-overlay-layer"
          style={{ pointerEvents: "none" }}
        />

        <div className="canvas-badge">
          <span>🕯️ 铜蜡刀临摹中</span>
          <b>{lineWidth === 6 ? "细线勾廓" : lineWidth === 14 ? "粗线封蜡" : "中度描绘"}</b>
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="draw-toolbar">
        <div className="brush-size-group">
          <span>刀尖线宽：</span>
          <button
            type="button"
            className={lineWidth === 6 ? "is-active" : ""}
            onClick={() => {
              setLineWidth(6);
              waxAudio.playWaxScrape();
            }}
          >
            细线 (6px)
          </button>
          <button
            type="button"
            className={lineWidth === 10 ? "is-active" : ""}
            onClick={() => {
              setLineWidth(10);
              waxAudio.playWaxScrape();
            }}
          >
            中线 (10px)
          </button>
          <button
            type="button"
            className={lineWidth === 16 ? "is-active" : ""}
            onClick={() => {
              setLineWidth(16);
              waxAudio.playWaxScrape();
            }}
          >
            封蜡 (16px)
          </button>
        </div>

        <div className="canvas-action-group">
          <button
            type="button"
            className={`tool-btn ${guideOpacity > 0 ? "is-active" : ""}`}
            onClick={() => {
              setGuideOpacity((prev) => (prev >= 0.75 ? 0 : prev === 0 ? 0.4 : 0.85));
            }}
          >
            {guideOpacity === 0 ? "👁️ 显现底稿" : guideOpacity < 0.6 ? "🔍 清晰底稿" : "👁️ 隐藏底稿"}
          </button>
          <button type="button" className="tool-btn" onClick={handleUndo}>
            撤销
          </button>
          <button type="button" className="tool-btn danger" onClick={handleClear}>
            清空重画
          </button>
        </div>
      </div>

      {/* Progress & Metrics */}
      <div className="draw-stats-bar">
        <div className="stat-pill">
          <span>落蜡笔数</span>
          <b>{strokeCount} 笔</b>
        </div>
        <div className="stat-pill">
          <span>防染留白度</span>
          <b>{coverage}%</b>
        </div>
        <div className="stat-pill">
          <span>工艺判定</span>
          <b>{strokeCount >= 6 ? "✅ 封蜡已就绪" : "⚠️ 至少描画 6 笔"}</b>
        </div>
      </div>
    </div>
  );
}
