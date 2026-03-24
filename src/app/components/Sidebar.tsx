import { Folder, FileCode2, ChevronRight, ChevronDown, MoreHorizontal, Search, Settings, Hash, FileJson, FileType } from "lucide-react";
import clsx from "clsx";
import { useState, useCallback } from "react";
import { motion } from "motion/react";

export function Sidebar({ className }: { className?: string }) {
  const [activeFile, setActiveFile] = useState("index.js");

  const files = [
    { name: "index.js", type: "js", icon: FileCode2, color: "text-yellow-400" },
    { name: "styles.css", type: "css", icon: Hash, color: "text-blue-400" },
    { name: "server.py", type: "python", icon: FileType, color: "text-green-400" },
    { name: "package.json", type: "json", icon: FileJson, color: "text-red-400" },
  ];

  const handleFileClick = useCallback((fileName: string) => {
    setActiveFile(fileName);
  }, []);

  return (
    <aside className={clsx("w-[280px] border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col h-full select-none", className)}>
      {/* Sidebar Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-white/5">
        <span className="text-xs font-bold text-white/60 tracking-[0.2em] uppercase">Explorer</span>
        <div className="flex gap-2">
          <Search className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
          <MoreHorizontal className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {/* Project Root */}
        <div className="flex items-center gap-1 px-2 py-1.5 text-white/60 hover:text-white cursor-pointer transition-colors rounded-lg hover:bg-white/5 group">
          <ChevronDown className="w-4 h-4" />
          <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          <span className="font-bold text-sm tracking-wide group-hover:text-neon-green transition-colors">CODE-ALONG</span>
        </div>
        
        {/* Files List */}
        <div className="pl-6 space-y-[2px] mt-1 relative">
          {/* Vertical Guide Line */}
          <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-white/5" />

          {files.map((file) => (
            <div 
              key={file.name}
              onClick={() => handleFileClick(file.name)}
              className={clsx(
                "relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group border border-transparent",
                activeFile === file.name 
                  ? "bg-white/10 text-white border-white/5 shadow-lg" 
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              {activeFile === file.name && (
                <motion.div 
                  layoutId="active-file"
                  className="absolute inset-0 bg-neon-green/5 rounded-md border border-neon-green/20"
                  transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <file.icon className={clsx("w-4 h-4 relative z-10", file.color)} />
              <span className={clsx("text-sm font-medium relative z-10", activeFile === file.name && "text-neon-green")}>
                {file.name}
              </span>

              {activeFile === file.name && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_5px_#39FF14]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 text-white/40 hover:text-white cursor-pointer transition-colors px-2 py-2 rounded-lg hover:bg-white/5">
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wide">SETTINGS</span>
        </div>
      </div>
    </aside>
  );
}