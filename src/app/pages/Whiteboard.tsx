import React, { useRef, useState, useCallback } from 'react';
import { MousePointer2, Pen, Eraser, Square, Type } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

export default function WhiteboardPage() {
  const [activeTool, setActiveTool] = useState('select');
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple zoom/pan simulation
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'select') {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [activeTool, position.x, position.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  }, [isDragging, startPos.x, startPos.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleToolChange = useCallback((toolId: string) => {
    setActiveTool(toolId);
  }, []);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pen, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
    { id: 'square', icon: Square, label: 'Shape' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-transparent relative cursor-crosshair">
      
      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="w-full h-full relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: activeTool === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
      >
        {/* Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        />

        {/* Canvas Elements Container */}
        <motion.div 
          className="absolute inset-0 origin-top-left will-change-transform"
          style={{ x: position.x, y: position.y, scale }}
        >
          {/* Example Diagram */}
          <div className="absolute top-[200px] left-[300px] w-[800px] h-[600px] pointer-events-none">
            
            {/* Rectangle 1 (Start) */}
            <div className="absolute top-10 left-10 w-48 h-24 border-2 border-neon-green/50 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-neon-green font-bold text-lg shadow-[0_0_20px_rgba(57,255,20,0.1)]">
              <span className="drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]">User Login</span>
            </div>

            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <defs>
                    <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#39FF14" />
                    </marker>
                    <marker id="arrow-cyan" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#22d3ee" />
                    </marker>
                </defs>
                
                {/* Line 1 */}
                <path d="M 130 134 L 130 180 L 220 180" stroke="#39FF14" strokeWidth="2" fill="none" markerEnd="url(#arrow-green)" strokeDasharray="5,5" />
            </svg>

            {/* Diamond (Decision) */}
            <div className="absolute top-[120px] left-[220px] w-32 h-32">
              <div className="w-full h-full border-2 border-cyan-400/50 bg-black/40 backdrop-blur-md transform rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.1)] rounded-lg">
                <div className="transform -rotate-45 text-cyan-400 font-bold text-center drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  Valid<br/>Auth?
                </div>
              </div>
            </div>

            {/* Line 2 (Yes) */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <path d="M 350 184 L 450 184" stroke="#22d3ee" strokeWidth="2" fill="none" markerEnd="url(#arrow-cyan)" />
                <text x="380" y="170" fill="#22d3ee" fontSize="12" fontWeight="bold">YES</text>
            </svg>

            {/* Rectangle 2 (Dashboard) */}
            <div className="absolute top-[140px] left-[450px] w-48 h-24 border-2 border-purple-500/50 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-purple-400 font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <span className="drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">Dashboard</span>
            </div>

            {/* Sticky Note */}
            <div className="absolute top-[320px] left-[50px] w-56 h-56 bg-yellow-300/90 text-black p-6 shadow-xl transform -rotate-3 rounded-sm font-handwriting">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-400/50 backdrop-blur-sm rotate-2 transform skew-x-12 opacity-50" />
              <p className="font-bold mb-4 text-lg border-b-2 border-black/10 pb-2">To Do List:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium">
                <li>Implement OAuth</li>
                <li>Fix WebSocket bug</li>
                <li>Design new schema</li>
              </ul>
            </div>

          </div>
        </motion.div>
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 flex items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={clsx(
                "p-3 rounded-xl transition-all relative group overflow-hidden",
                activeTool === tool.id 
                  ? "text-black shadow-[0_0_15px_rgba(57,255,20,0.4)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
              title={tool.label}
            >
              {activeTool === tool.id && (
                <motion.div 
                  layoutId="active-tool-bg"
                  className="absolute inset-0 bg-neon-green"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative z-10">
                <tool.icon className="w-5 h-5" />
              </span>
            </button>
          ))}
          
          <div className="w-[1px] h-8 bg-white/10 mx-2" />
          
          <div className="flex gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-white border-2 border-white cursor-pointer hover:scale-110 transition-transform" />
            <div className="w-6 h-6 rounded-full bg-neon-green border-2 border-transparent cursor-pointer hover:scale-110 transition-transform" />
            <div className="w-6 h-6 rounded-full bg-neon-pink border-2 border-transparent cursor-pointer hover:scale-110 transition-transform" />
            <div className="w-6 h-6 rounded-full bg-cyan-400 border-2 border-transparent cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}