import React, { useState, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CodeEditor } from '../components/CodeEditor';
import { VideoBubbles } from '../components/VideoBubbles';
import { Terminal, X, Maximize2, Minimize2, MoreHorizontal, Play, Save } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

export default function CollaboratePage() {
  const [code, setCode] = useState(`// Welcome to Code Along!
// Start collaborating with your team.

function initializeApp() {
  const user = authenticate();
  console.log("User logged in:", user.name);
  
  // Connect to websocket
  const socket = new WebSocket("wss://api.codealong.io");
  
  socket.onopen = () => {
    console.log("Connected to server");
    startSession();
  };
}

function startSession() {
  // Initialize collaboration session
  console.log("Session started");
}

initializeApp();`);

  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleTerminalToggle = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-transparent text-white relative">
      {/* Left Sidebar */}
      <Sidebar className="z-20" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Editor Tabs */}
        <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-2 gap-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-t-lg border-t border-x border-white/10 text-sm font-medium text-white relative group cursor-pointer">
            <span className="text-yellow-400">JS</span>
            <span>index.js</span>
            <X className="w-3 h-3 ml-2 text-white/40 group-hover:text-white transition-colors" />
            <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#1e1e1e]" /> {/* Mask border-bottom */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-neon-green" />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/40 hover:text-white/80 cursor-pointer transition-colors">
            <span className="text-blue-400">#</span>
            <span>styles.css</span>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
             <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
               <Save className="w-4 h-4" />
             </button>
             <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
               <MoreHorizontal className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 relative bg-[#0a0a0a]/80 backdrop-blur-sm">
          <CodeEditor 
            value={code} 
            onChange={setCode} 
            language="js" 
            className="h-full"
          />
          
          {/* Floating Video Bubbles */}
          <div className="absolute top-4 right-4 z-30 pointer-events-none">
            <div className="pointer-events-auto">
              <VideoBubbles className="flex-col gap-4" stacked={false} />
            </div>
          </div>
        </div>

        {/* Bottom Terminal Panel */}
        <motion.div 
          initial={false}
          animate={{ height: isTerminalOpen ? 240 : 32 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="border-t border-white/10 bg-black/80 backdrop-blur-xl flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20"
        >
          {/* Terminal Header */}
          <div 
            className="h-8 min-h-[32px] px-4 flex items-center justify-between border-b border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={handleTerminalToggle}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-neon-green" />
                <span className="text-xs font-bold text-neon-green tracking-wider">TERMINAL</span>
              </div>
              <div className="h-3 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 opacity-50 text-xs">
                <span>Output</span>
                <span>Problems</span>
                <span>Debug Console</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isTerminalOpen ? <Minimize2 className="w-3 h-3 text-white/40" /> : <Maximize2 className="w-3 h-3 text-white/40" />}
            </div>
          </div>

          {/* Terminal Content */}
          <div className={clsx("flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar relative", !isTerminalOpen && "hidden")}>
             <div className="absolute inset-0 bg-black/50 pointer-events-none" /> {/* Darken background */}
             <div className="relative z-10 text-white/80">
                <div className="mb-2 opacity-50 text-xs">Microsoft Windows [Version 10.0.19045.3693]</div>
                <div className="mb-4 opacity-50 text-xs">(c) Microsoft Corporation. All rights reserved.</div>
                
                <div className="group">
                  <span className="text-neon-green">user@code-along</span>
                  <span className="text-white/40">:</span>
                  <span className="text-blue-400">~/projects/app</span>
                  <span className="text-white/40">$</span>
                  <span className="ml-2">npm run dev</span>
                </div>
                
                <div className="mt-2 pl-4 border-l-2 border-white/10">
                  <div className="text-green-400">&gt; code-along@1.0.0 dev</div>
                  <div className="text-green-400">&gt; next dev --turbo</div>
                  <br/>
                  <div className="text-white/60">Ready in 1234ms</div>
                  <div className="text-white/60">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    Server connected to port 3000
                  </div>
                </div>

                <div className="mt-4 group flex items-center">
                  <span className="text-neon-green">user@code-along</span>
                  <span className="text-white/40">:</span>
                  <span className="text-blue-400">~/projects/app</span>
                  <span className="text-white/40">$</span>
                  <span className="ml-2 block w-2 h-4 bg-neon-green" style={{ animation: 'blink 1s step-end infinite' }} />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}