import React, { useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CodeEditor } from '../components/CodeEditor';
import { VideoBubbles } from '../components/VideoBubbles';
import { Terminal, X, Maximize2, Minimize2, MoreHorizontal, Save } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { LANGUAGE_LABELS } from '../utils/executeCode';

export default function CollaboratePage() {
  const {
    activeFile,
    activeFileId,
    openFiles,
    setActiveFile,
    closeFile,
    updateActiveFileContent,
    isTerminalOpen,
    setIsTerminalOpen,
    terminalEntries,
    executionStatus,
    appendTerminalEntry,
  } = useWorkspace();

  const handleTerminalToggle = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, [setIsTerminalOpen]);

  const handleSaveClick = useCallback(() => {
    appendTerminalEntry("system", `Workspace state saved locally for ${activeFile?.name || "current file"}.`);
  }, [activeFile?.name, appendTerminalEntry]);

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-transparent text-white relative">
      {/* Left Sidebar */}
      <Sidebar className="z-20" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        
        {/* Editor Tabs */}
        <div className="h-10 bg-black/40 border-b border-white/5 flex items-center px-2 gap-2 backdrop-blur-sm">
          {openFiles.map((file) => {
            const isActive = file.id === activeFileId;

            return (
              <div
                key={file.id}
                onClick={() => setActiveFile(file.id)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t border-x text-sm font-medium relative group cursor-pointer",
                  isActive
                    ? "bg-white/10 border-white/10 text-white"
                    : "border-transparent text-white/40 hover:text-white/80",
                )}
              >
                <span className={clsx(isActive ? "text-neon-green" : "text-cyan-300")}>
                  {LANGUAGE_LABELS[file.language]}
                </span>
                <span>{file.name}</span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    closeFile(file.id);
                  }}
                  className="rounded p-0.5 text-white/40 transition-colors hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
                {isActive && (
                  <>
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#1e1e1e]" />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-neon-green" />
                  </>
                )}
              </div>
            );
          })}
          
          <div className="ml-auto flex items-center gap-2">
             <button onClick={handleSaveClick} className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
               <Save className="w-4 h-4" />
             </button>
             <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
               <MoreHorizontal className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 relative bg-[#0a0a0a]/80 backdrop-blur-sm">
          {activeFile ? (
            <CodeEditor 
              value={activeFile.content} 
              onChange={updateActiveFileContent} 
              language={activeFile.language} 
              className="h-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/40">
              Create a file in the explorer to start editing.
            </div>
          )}
          
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
                <div className="mb-2 opacity-50 text-xs">Code Along execution console</div>
                <div className="mb-4 opacity-50 text-xs">Requests are sent through your app server, not directly from the browser.</div>

                <div className="space-y-3">
                  {terminalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={clsx(
                        "whitespace-pre-wrap break-words",
                        entry.kind === "command" && "text-neon-green",
                        entry.kind === "output" && "text-white/90",
                        entry.kind === "error" && "text-red-400",
                        entry.kind === "system" && "text-white/50",
                      )}
                    >
                      {entry.text}
                    </div>
                  ))}

                  {executionStatus === "running" && (
                    <div className="flex items-center gap-2 text-cyan-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" style={{ animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      Sandbox is executing...
                    </div>
                  )}
                </div>

                <div className="mt-4 group flex items-center">
                  <span className="text-neon-green">user@code-along</span>
                  <span className="text-white/40">:</span>
                  <span className="text-blue-400">~/workspace</span>
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
