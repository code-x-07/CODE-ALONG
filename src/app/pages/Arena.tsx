import React, { useState, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CodeEditor } from '../components/CodeEditor';
import { VideoBubbles } from '../components/VideoBubbles';
import { Swords } from 'lucide-react';

export default function ArenaPage() {
  const [playerCode, setPlayerCode] = useState(`// Your Code (JavaScript)
function solveChallenge(input) {
  // Write your solution here
  return input.split('').reverse().join('');
}`);

  const [opponentCode, setOpponentCode] = useState(`# Opponent Code (Python)
def solve_challenge(input_str):
    # Opponent is typing...
    return input_str[::-1]`);

  // Memoize setters
  const handleOpponentCodeChange = useCallback((val: string) => setOpponentCode(val), []);

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-transparent text-white relative">
      <Sidebar />

      <div className="flex-1 flex flex-row relative">
        {/* Player 1 Panel */}
        <div className="flex-1 flex flex-col p-4 pr-2 border-r border-white/5 relative bg-black/20 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_#39FF14]" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
              <span className="text-neon-green font-bold text-sm uppercase tracking-wider">Your Code</span>
            </div>
            <div className="text-xs text-white/40 font-mono">JS</div>
          </div>
          <div className="flex-1 relative rounded-lg overflow-hidden border border-neon-green/20 shadow-[0_0_20px_rgba(57,255,20,0.05)]">
            <CodeEditor 
              value={playerCode} 
              onChange={setPlayerCode} 
              language="js" 
              className="h-full bg-black/40"
            />
          </div>
        </div>

        {/* Player 2 Panel */}
        <div className="flex-1 flex flex-col p-4 pl-2 relative bg-black/20 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs text-white/40 font-mono">PYTHON</div>
            <div className="flex items-center gap-2">
              <span className="text-neon-pink font-bold text-sm uppercase tracking-wider">Opponent</span>
              <span className="w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_8px_#FF1493]" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
            </div>
          </div>
          <div className="flex-1 relative rounded-lg overflow-hidden border border-neon-pink/20 shadow-[0_0_20px_rgba(255,20,147,0.05)]">
             <CodeEditor 
               value={opponentCode} 
               onChange={handleOpponentCodeChange} 
               language="py" 
               className="h-full bg-black/40"
               readOnly={true}
             />
             {/* Typing Indicator Overlay */}
             <div className="absolute bottom-4 right-4 flex gap-1 pointer-events-none">
               <div className="w-1.5 h-1.5 bg-neon-pink/50 rounded-full" style={{ animation: 'bounce 1s infinite', animationDelay: '0ms' }} />
               <div className="w-1.5 h-1.5 bg-neon-pink/50 rounded-full" style={{ animation: 'bounce 1s infinite', animationDelay: '150ms' }} />
               <div className="w-1.5 h-1.5 bg-neon-pink/50 rounded-full" style={{ animation: 'bounce 1s infinite', animationDelay: '300ms' }} />
             </div>
          </div>
        </div>

        {/* Center VS Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-xl rounded-full p-4 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative group">
             <div className="absolute inset-0 bg-gradient-to-tr from-neon-green/20 to-neon-pink/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
             <Swords className="w-8 h-8 text-white relative z-10" />
          </div>
          <div className="bg-black/80 px-4 py-1.5 rounded-full border border-white/10 text-xs font-black tracking-[0.2em] text-white shadow-lg">
            VS
          </div>
        </div>
      </div>
    </div>
  );
}