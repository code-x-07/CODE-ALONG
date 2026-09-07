import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eraser, MousePointer2, Pen, Square, Trash2, Type, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import { makeOpId, useWhiteboard, WhiteboardOp, WhiteboardTool } from "../context/WhiteboardContext";
import { useSessionCall } from "../context/SessionCallContext";

const COLORS = ["#ffffff", "#39FF14", "#FF1493", "#22d3ee", "#fbbf24"];
const PEN_SIZES = [2, 4, 8];
const ERASER_SIZE = 28;
const PROGRESS_STREAM_MS = 80;

type Camera = { x: number; y: number; scale: number };

function drawOp(context: CanvasRenderingContext2D, op: WhiteboardOp) {
  if (op.kind === "clear") {
    return;
  }

  if (op.kind === "stroke") {
    if (op.points.length < 4) {
      return;
    }

    context.save();
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = op.size;

    if (op.tool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.strokeStyle = "rgba(0,0,0,1)";
    } else {
      context.strokeStyle = op.color;
      context.shadowColor = op.color;
      context.shadowBlur = op.size * 2;
    }

    context.beginPath();
    context.moveTo(op.points[0], op.points[1]);

    for (let index = 2; index < op.points.length - 2; index += 2) {
      const midX = (op.points[index] + op.points[index + 2]) / 2;
      const midY = (op.points[index + 1] + op.points[index + 3]) / 2;
      context.quadraticCurveTo(op.points[index], op.points[index + 1], midX, midY);
    }

    context.stroke();
    context.restore();
    return;
  }

  if (op.kind === "rect") {
    context.save();
    context.strokeStyle = op.color;
    context.lineWidth = 2;
    context.shadowColor = op.color;
    context.shadowBlur = 12;
    const radius = 10;
    const { x, y, w, h } = op;
    context.beginPath();
    context.roundRect(Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h), radius);
    context.stroke();
    context.fillStyle = `${op.color}14`;
    context.fill();
    context.restore();
    return;
  }

  if (op.kind === "text") {
    context.save();
    context.fillStyle = op.color;
    context.shadowColor = op.color;
    context.shadowBlur = 8;
    context.font = `600 ${op.fontSize}px "JetBrains Mono", ui-monospace, monospace`;
    context.textBaseline = "top";
    op.text.split("\n").forEach((line, index) => {
      context.fillText(line, op.x, op.y + index * op.fontSize * 1.4);
    });
    context.restore();
  }
}

function renderBoard(
  canvas: HTMLCanvasElement,
  camera: Camera,
  ops: WhiteboardOp[],
  livePreviews: Map<string, WhiteboardOp>,
  draftOp: WhiteboardOp | null,
) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);

  // Ops after the most recent "clear" are the visible board.
  const lastClearIndex = ops.map((op) => op.kind).lastIndexOf("clear");
  const visibleOps = lastClearIndex >= 0 ? ops.slice(lastClearIndex + 1) : ops;

  for (const op of visibleOps) {
    drawOp(context, op);
  }

  for (const preview of livePreviews.values()) {
    drawOp(context, preview);
  }

  if (draftOp) {
    drawOp(context, draftOp);
  }
}

export default function WhiteboardPage() {
  const { ops, livePreviews, commitOp, streamProgress, undoLastOwnOp, clearBoard, revision } = useWhiteboard();
  const { localIdentity, isConnected, participants } = useSessionCall();
  const author = localIdentity || "local";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<WhiteboardTool>("pen");
  const [activeColor, setActiveColor] = useState(COLORS[1]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; screenX: number; screenY: number; value: string } | null>(null);

  const draftOpRef = useRef<WhiteboardOp | null>(null);
  const panStateRef = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number } | null>(null);
  const lastStreamRef = useRef(0);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const cam = cameraRef.current;

    if (!bounds) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - bounds.left - cam.x) / cam.scale,
      y: (clientY - bounds.top - cam.y) / cam.scale,
    };
  }, []);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      renderBoard(canvas, cameraRef.current, ops, livePreviews, draftOpRef.current);
    }
  }, [livePreviews, ops]);

  // Repaint on data changes, camera moves, and container resizes.
  useEffect(() => {
    repaint();
  }, [camera, ops, revision, repaint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      repaint();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [repaint]);

  const commitTextDraft = useCallback(() => {
    setTextDraft((draft) => {
      if (draft && draft.value.trim()) {
        commitOp({
          id: makeOpId(),
          author,
          kind: "text",
          color: activeColor,
          x: draft.x,
          y: draft.y,
          text: draft.value,
          fontSize: 20,
        });
      }

      return null;
    });
  }, [activeColor, author, commitOp]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic or already-released pointers can't be captured — drawing still works.
      }

      if (textDraft) {
        commitTextDraft();
        return;
      }

      if (activeTool === "select") {
        panStateRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          cameraX: cameraRef.current.x,
          cameraY: cameraRef.current.y,
        };
        return;
      }

      const world = toWorld(event.clientX, event.clientY);

      if (activeTool === "text") {
        const bounds = event.currentTarget.getBoundingClientRect();
        setTextDraft({
          x: world.x,
          y: world.y,
          screenX: event.clientX - bounds.left,
          screenY: event.clientY - bounds.top,
          value: "",
        });
        return;
      }

      if (activeTool === "pen" || activeTool === "eraser") {
        draftOpRef.current = {
          id: makeOpId(),
          author,
          kind: "stroke",
          tool: activeTool,
          color: activeColor,
          size: activeTool === "eraser" ? ERASER_SIZE : penSize,
          points: [world.x, world.y, world.x, world.y],
        };
      } else if (activeTool === "rect") {
        draftOpRef.current = {
          id: makeOpId(),
          author,
          kind: "rect",
          color: activeColor,
          x: world.x,
          y: world.y,
          w: 0,
          h: 0,
        };
      }

      repaint();
    },
    [activeColor, activeTool, author, commitTextDraft, penSize, repaint, textDraft, toWorld],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (panStateRef.current) {
        const pan = panStateRef.current;
        setCamera((current) => ({
          ...current,
          x: pan.cameraX + event.clientX - pan.startX,
          y: pan.cameraY + event.clientY - pan.startY,
        }));
        return;
      }

      const draft = draftOpRef.current;

      if (!draft) {
        return;
      }

      const world = toWorld(event.clientX, event.clientY);

      if (draft.kind === "stroke") {
        draft.points.push(world.x, world.y);
      } else if (draft.kind === "rect") {
        draft.w = world.x - draft.x;
        draft.h = world.y - draft.y;
      }

      const now = performance.now();

      if (now - lastStreamRef.current > PROGRESS_STREAM_MS) {
        lastStreamRef.current = now;
        streamProgress(draft);
      }

      repaint();
    },
    [repaint, streamProgress, toWorld],
  );

  const handlePointerUp = useCallback(() => {
    panStateRef.current = null;
    const draft = draftOpRef.current;

    if (!draft) {
      return;
    }

    draftOpRef.current = null;

    const isMeaningful =
      (draft.kind === "stroke" && draft.points.length >= 6) ||
      (draft.kind === "rect" && Math.abs(draft.w) > 4 && Math.abs(draft.h) > 4);

    if (isMeaningful) {
      commitOp(draft);
    } else {
      repaint();
    }
  }, [commitOp, repaint]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;

    setCamera((current) => {
      const nextScale = Math.min(4, Math.max(0.25, current.scale * (event.deltaY < 0 ? 1.08 : 0.92)));
      const ratio = nextScale / current.scale;

      return {
        scale: nextScale,
        x: pointerX - (pointerX - current.x) * ratio,
        y: pointerY - (pointerY - current.y) * ratio,
      };
    });
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const container = containerRef.current;
    const centerX = (container?.clientWidth || 0) / 2;
    const centerY = (container?.clientHeight || 0) / 2;

    setCamera((current) => {
      const nextScale = Math.min(4, Math.max(0.25, current.scale * factor));
      const ratio = nextScale / current.scale;

      return {
        scale: nextScale,
        x: centerX - (centerX - current.x) * ratio,
        y: centerY - (centerY - current.y) * ratio,
      };
    });
  }, []);

  const tools = useMemo(
    () => [
      { id: "select" as const, icon: MousePointer2, label: "Pan / Select" },
      { id: "pen" as const, icon: Pen, label: "Draw" },
      { id: "eraser" as const, icon: Eraser, label: "Erase" },
      { id: "rect" as const, icon: Square, label: "Rectangle" },
      { id: "text" as const, icon: Type, label: "Text" },
    ],
    [],
  );

  const cursorStyle =
    activeTool === "select" ? (panStateRef.current ? "grabbing" : "grab") : activeTool === "text" ? "text" : "crosshair";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-transparent">
      {/* Dot grid that follows the camera */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #5B8DEF 1px, transparent 1px)",
          backgroundSize: `${24 * camera.scale}px ${24 * camera.scale}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      />

      <div ref={containerRef} className="relative h-full w-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: cursorStyle }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
        />

        {textDraft && (
          <textarea
            autoFocus
            value={textDraft.value}
            onChange={(event) => setTextDraft((draft) => (draft ? { ...draft, value: event.target.value } : draft))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                commitTextDraft();
              }

              if (event.key === "Escape") {
                setTextDraft(null);
              }
            }}
            onBlur={commitTextDraft}
            placeholder="Type, Enter to place"
            className="absolute z-30 min-h-[40px] w-64 resize-none rounded-panel border border-line-strong bg-surface px-3 py-2 font-mono text-sm text-ink outline-none focus:border-accent/40"
            style={{ left: textDraft.screenX, top: textDraft.screenY, color: activeColor }}
          />
        )}
      </div>

      {/* Status chip */}
      <div className="absolute right-6 top-6 z-40 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]">
        <span
          className={clsx("h-2 w-2 rounded-full", isConnected ? "bg-ok" : "bg-ink-faint")}
        />
        {isConnected ? `Live · ${participants.length} on board` : "Local board · join a room to sync"}
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-panel border border-line bg-surface px-2 py-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={clsx(
                "group relative overflow-hidden rounded-panel p-3 transition-all",
                activeTool === tool.id
                  ? "text-ground"
                  : "text-ink-faint hover:bg-raised hover:text-ink",
              )}
              title={tool.label}
            >
              {activeTool === tool.id && (
                <motion.div
                  layoutId="active-tool-bg"
                  className="absolute inset-0 bg-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10">
                <tool.icon className="h-5 w-5" />
              </span>
            </button>
          ))}

          <div className="mx-2 h-8 w-[1px] bg-line" />

          <div className="flex gap-2 px-1">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setActiveColor(color)}
                className={clsx(
                  "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                  activeColor === color ? "scale-110 border-ink" : "border-transparent",
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="mx-2 h-8 w-[1px] bg-line" />

          <div className="flex items-center gap-1 px-1">
            {PEN_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setPenSize(size)}
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-control transition-colors",
                  penSize === size ? "bg-raised text-ink" : "text-ink-faint hover:text-ink",
                )}
                title={`Stroke ${size}px`}
              >
                <span className="rounded-full bg-current" style={{ width: size + 2, height: size + 2 }} />
              </button>
            ))}
          </div>

          <div className="mx-2 h-8 w-[1px] bg-line" />

          <button
            onClick={() => zoomBy(1.2)}
            className="rounded-panel p-3 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={() => zoomBy(1 / 1.2)}
            className="rounded-panel p-3 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={() => undoLastOwnOp(author)}
            className="rounded-panel p-3 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
            title="Undo my last action"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => clearBoard(author)}
            className="rounded-panel p-3 text-ink-faint transition-colors hover:bg-bad/10 hover:text-bad"
            title="Clear board"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
