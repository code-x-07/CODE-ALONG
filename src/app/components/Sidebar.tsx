import {
  Braces,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Hash,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import React, { useCallback } from "react";
import { motion } from "motion/react";
import { useWorkspace, WorkspaceFolder, WorkspaceNode } from "../context/WorkspaceContext";

function FileNodeIcon({ fileName }: { fileName: string }) {
  if (fileName.endsWith(".json")) {
    return <FileJson className="h-4 w-4 text-red-400" />;
  }

  if (fileName.endsWith(".css")) {
    return <Hash className="h-4 w-4 text-blue-400" />;
  }

  if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    return <FileText className="h-4 w-4 text-white/60" />;
  }

  if (fileName.endsWith(".c") || fileName.endsWith(".cpp") || fileName.endsWith(".cs")) {
    return <Braces className="h-4 w-4 text-cyan-300" />;
  }

  return <FileCode2 className="h-4 w-4 text-yellow-400" />;
}

function TreeNode({
  node,
  depth,
}: {
  node: WorkspaceNode;
  depth: number;
}) {
  const { activeFileId, selectedFolderId, setActiveFile, openFolder, deleteNode } = useWorkspace();

  if (node.type === "folder") {
    const isSelected = selectedFolderId === node.id;

    return (
      <div className="space-y-1">
        <div
          onClick={() => openFolder(node.id)}
          className={clsx(
            "group relative flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer",
            isSelected
              ? "border-neon-green/20 bg-neon-green/5 text-white"
              : "border-transparent text-white/60 hover:bg-white/5 hover:text-white",
          )}
          style={{ marginLeft: depth * 12 }}
        >
          {isSelected && (
            <motion.div
              layoutId="selected-folder"
              className="absolute inset-0 rounded-md border border-neon-green/20 bg-neon-green/5"
            />
          )}
          <span className="relative z-10">
            {isSelected ? (
              <FolderOpen className="h-4 w-4 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
            )}
          </span>
          <span className="relative z-10 font-medium">{node.name}</span>

          {node.id !== "root" && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                deleteNode(node.id);
              }}
              className="relative z-10 ml-auto rounded p-1 text-white/30 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  const isActive = activeFileId === node.id;

  return (
    <div
      onClick={() => setActiveFile(node.id)}
      className={clsx(
        "group relative flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer",
        isActive
          ? "border-white/5 bg-white/10 text-white shadow-lg"
          : "border-transparent text-white/50 hover:bg-white/5 hover:text-white",
      )}
      style={{ marginLeft: depth * 12 }}
    >
      {isActive && (
        <motion.div
          layoutId="active-file"
          className="absolute inset-0 rounded-md border border-neon-green/20 bg-neon-green/5"
          transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span className="relative z-10">
        <FileNodeIcon fileName={node.name} />
      </span>
      <span className={clsx("relative z-10 font-medium", isActive && "text-neon-green")}>{node.name}</span>

      <button
        onClick={(event) => {
          event.stopPropagation();
          deleteNode(node.id);
        }}
        className="relative z-10 ml-auto rounded p-1 text-white/30 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { root, selectedFolderId, createFile, createFolder } = useWorkspace();

  const handleCreateFile = useCallback(() => {
    const fileName = window.prompt(
      "New file name. Include an extension such as .js, .py, .java, .cpp, .go, .php, .rb, .rs, .c, .cs, .css, or .json",
      "main.py",
    );

    if (fileName) {
      createFile(selectedFolderId, fileName);
    }
  }, [createFile, selectedFolderId]);

  const handleCreateFolder = useCallback(() => {
    const folderName = window.prompt("New folder name", "src");

    if (folderName) {
      createFolder(selectedFolderId, folderName);
    }
  }, [createFolder, selectedFolderId]);

  return (
    <aside className={clsx("w-[300px] border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col h-full select-none", className)}>
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-white/5">
        <span className="text-xs font-bold text-white/60 tracking-[0.2em] uppercase">Explorer</span>
        <div className="flex gap-2">
          <button onClick={handleCreateFile} className="text-white/40 hover:text-neon-green transition-colors" title="New file">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={handleCreateFolder} className="text-white/40 hover:text-cyan-300 transition-colors" title="New folder">
            <FolderPlus className="h-4 w-4" />
          </button>
          <Search className="w-4 h-4 text-white/25" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <TreeNode node={root} depth={0} />
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 text-white/40 hover:text-white cursor-pointer transition-colors px-2 py-2 rounded-lg hover:bg-white/5">
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wide">SETTINGS</span>
        </div>
      </div>
    </aside>
  );
}
