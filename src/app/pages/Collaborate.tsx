import { useCallback, useEffect, useRef } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CodeEditor } from '../components/CodeEditor';
import { VideoBubbles } from '../components/VideoBubbles';
import { Radio, Terminal, X, Maximize2, Minimize2, MoreHorizontal, Save } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSessionCall } from '../context/SessionCallContext';
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
  const { isConnected, participants, openJoinModal } = useSessionCall();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Keep the newest terminal output in view.
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [terminalEntries, executionStatus]);

  const handleTerminalToggle = useCallback(() => {
    setIsTerminalOpen(prev => !prev);
  }, [setIsTerminalOpen]);

  const handleSaveClick = useCallback(() => {
    appendTerminalEntry("system", `Workspace state saved locally for ${activeFile?.name || "current file"}.`);
  }, [activeFile?.name, appendTerminalEntry]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent text-ink">
      {/* Left Sidebar */}
      <Sidebar className="z-20" />

      {/* Main Content Area */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">

        {/* Editor Tabs */}
        <div className="flex h-chrome items-center gap-2 border-b border-line bg-surface px-2">
          {openFiles.map((file) => {
            const isActive = file.id === activeFileId;

            return (
              <div
                key={file.id}
                onClick={() => setActiveFile(file.id)}
                className={clsx(
                  "group relative flex cursor-pointer items-center gap-2 rounded-control px-3 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent-subtle text-accent ring-1 ring-inset ring-accent/25"
                    : "text-ink-muted hover:bg-raised hover:text-ink",
                )}
              >
                <span className={clsx(isActive ? "text-accent" : "text-ink-faint")}>
                  {LANGUAGE_LABELS[file.language]}
                </span>
                <span>{file.name}</span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    closeFile(file.id);
                  }}
                  className="rounded p-0.5 text-ink-faint transition-colors hover:text-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
             {/* Live sync status */}
             <button
               onClick={() => openJoinModal()}
               className={clsx(
                 "flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                 isConnected
                   ? "border-accent/40 bg-accent-subtle text-accent"
                   : "border-line bg-raised text-ink-faint hover:text-ink",
               )}
               title={isConnected ? "Edits sync to everyone in the room" : "Join a room to code together"}
             >
               <Radio className="h-3 w-3" />
               {isConnected ? `Live Sync · ${participants.length}` : "Solo · Go Live"}
             </button>
             <button onClick={handleSaveClick} className="p-1.5 rounded hover:bg-raised text-ink-muted hover:text-ink transition-colors">
               <Save className="w-4 h-4" />
             </button>
             <button className="p-1.5 rounded hover:bg-raised text-ink-muted hover:text-ink transition-colors">
               <MoreHorizontal className="w-4 h-4" />
             </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="relative flex-1 bg-surface">
          {activeFile ? (
            <CodeEditor
              value={activeFile.content}
              onChange={updateActiveFileContent}
              language={activeFile.language}
              className="h-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-faint">
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
          className="z-20 flex flex-col border-t border-line bg-surface"
        >
          {/* Terminal Header */}
          <div
            className="h-8 min-h-[32px] px-4 flex items-center justify-between border-b border-line bg-raised cursor-pointer hover:bg-raised transition-colors"
            onClick={handleTerminalToggle}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-ink-muted" />
                <span className="text-xs font-bold text-ink-muted tracking-wider">TERMINAL</span>
              </div>
              <div className="h-3 w-[1px] bg-line" />
              <div className="flex items-center gap-2 opacity-50 text-xs">
                <span>Output</span>
                <span>Problems</span>
                <span>Debug Console</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTerminalOpen ? <Minimize2 className="w-3 h-3 text-ink-faint" /> : <Maximize2 className="w-3 h-3 text-ink-faint" />}
            </div>
          </div>

          {/* Terminal Content */}
          <div className={clsx("flex-1 p-4 font-mono text-sm overflow-y-auto custom-scrollbar", !isTerminalOpen && "hidden")}>
             <div className="text-ink-muted">
                <div className="mb-2 opacity-50 text-xs">Code Along execution console</div>
                <div className="mb-4 opacity-50 text-xs">JS executes in a sandboxed worker. Other languages run through the app server proxy.</div>

                <div className="space-y-3">
                  {terminalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={clsx(
                        "whitespace-pre-wrap break-words",
                        entry.kind === "command" && "text-ok",
                        entry.kind === "output" && "text-ink",
                        entry.kind === "error" && "text-bad",
                        entry.kind === "system" && "text-ink-muted",
                      )}
                    >
                      {entry.text}
                    </div>
                  ))}

                  {executionStatus === "running" && (
                    <div className="flex items-center gap-2 text-accent">
                      <span className="inline-block w-2 h-2 rounded-full bg-accent" style={{ animation: 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      Sandbox is executing...
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                <div className="mt-4 group flex items-center">
                  <span className="text-ok">user@code-along</span>
                  <span className="text-ink-faint">:</span>
                  <span className="text-accent">~/workspace</span>
                  <span className="text-ink-faint">$</span>
                  <span className="ml-2 block w-2 h-4 bg-ok" style={{ animation: 'blink 1s step-end infinite' }} />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
