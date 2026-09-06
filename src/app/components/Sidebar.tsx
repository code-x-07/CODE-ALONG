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
  Settings,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { useWorkspace, WorkspaceNode } from "../context/WorkspaceContext";

type Draft = { kind: "file" | "folder" } | null;

function FileNodeIcon({ fileName }: { fileName: string }) {
  const cls = "h-4 w-4 shrink-0 text-ink-faint";
  if (fileName.endsWith(".json")) return <FileJson className={cls} />;
  if (fileName.endsWith(".css")) return <Hash className={cls} />;
  if (fileName.endsWith(".txt") || fileName.endsWith(".md")) return <FileText className={cls} />;
  if (/\.(c|cpp|cs)$/.test(fileName)) return <Braces className={cls} />;
  return <FileCode2 className={cls} />;
}

function DraftInput({
  kind,
  onCommit,
  onCancel,
}: {
  kind: "file" | "folder";
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="flex items-center gap-2 rounded-control border border-accent/40 bg-accent-subtle px-2 py-1.5">
      {kind === "folder" ? (
        <Folder className="h-4 w-4 shrink-0 text-ink-muted" />
      ) : (
        <FileCode2 className="h-4 w-4 shrink-0 text-ink-muted" />
      )}
      <input
        autoFocus
        value={value}
        placeholder={kind === "file" ? "main.py" : "src"}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => (value.trim() ? onCommit(value) : onCancel())}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(value);
          if (e.key === "Escape") onCancel();
        }}
        className="w-full bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  );
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
      <div className="space-y-0.5">
        <div
          onClick={() => openFolder(node.id)}
          style={{ marginLeft: depth * 12 }}
          className={clsx(
            "group flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-[13px] transition-colors",
            isSelected
              ? "bg-accent-subtle text-accent ring-1 ring-inset ring-accent/25"
              : "text-ink-muted hover:bg-raised hover:text-ink",
          )}
        >
          {isSelected ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-ink-faint" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-ink-faint" />
          )}
          <span className="truncate font-mono">{node.name}</span>

          {node.id !== "root" && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                deleteNode(node.id);
              }}
              className="ml-auto rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-0.5">
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
      style={{ marginLeft: depth * 12 }}
      className={clsx(
        "group flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-[13px] transition-colors",
        isActive
          ? "bg-accent-subtle text-accent ring-1 ring-inset ring-accent/25"
          : "text-ink-muted hover:bg-raised hover:text-ink",
      )}
    >
      <FileNodeIcon fileName={node.name} />
      <span className="truncate font-mono">{node.name}</span>
      <button
        onClick={(event) => {
          event.stopPropagation();
          deleteNode(node.id);
        }}
        className="ml-auto rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const { root, selectedFolderId, createFile, createFolder } = useWorkspace();
  const [draft, setDraft] = useState<Draft>(null);

  const commitDraft = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && draft) {
        if (draft.kind === "file") createFile(selectedFolderId, trimmed);
        else createFolder(selectedFolderId, trimmed);
      }
      setDraft(null);
    },
    [draft, createFile, createFolder, selectedFolderId],
  );

  return (
    <aside className={clsx("flex h-full w-[280px] shrink-0 select-none flex-col border-r border-line bg-surface", className)}>
      <div className="flex h-chrome items-center justify-between border-b border-line px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDraft({ kind: "file" })}
            title="New file"
            className="rounded-control p-1 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDraft({ kind: "folder" })}
            title="New folder"
            className="rounded-control p-1 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-2">
        {draft && (
          <DraftInput
            kind={draft.kind}
            onCommit={commitDraft}
            onCancel={() => setDraft(null)}
          />
        )}
        <TreeNode node={root} depth={0} />
      </div>

      <div className="border-t border-line p-3">
        <div className="flex cursor-pointer items-center gap-3 rounded-control px-2 py-2 text-ink-faint transition-colors hover:bg-raised hover:text-ink">
          <Settings className="h-4 w-4" />
          <span className="text-[13px] font-medium">Settings</span>
        </div>
      </div>
    </aside>
  );
}
