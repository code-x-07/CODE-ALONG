import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSessionCall } from "./SessionCallContext";
import {
  CODE_TEMPLATES,
  EditorLanguage,
  executeCode,
  getLanguageFromFileName,
  isRunnableLanguage,
  LANGUAGE_LABELS,
} from "../utils/executeCode";

type WorkspaceMode = "collaborate" | "arena" | "whiteboard";
type ExecutionStatus = "idle" | "running" | "success" | "error";
type TerminalEntryKind = "system" | "command" | "output" | "error";

export type TerminalEntry = {
  id: number;
  kind: TerminalEntryKind;
  text: string;
};

export type WorkspaceFile = {
  id: string;
  type: "file";
  name: string;
  language: EditorLanguage;
  content: string;
};

export type WorkspaceFolder = {
  id: string;
  type: "folder";
  name: string;
  children: WorkspaceNode[];
};

export type WorkspaceNode = WorkspaceFile | WorkspaceFolder;

type StoredWorkspaceState = {
  root: WorkspaceFolder;
  activeFileId: string;
  openFileIds: string[];
};

type WorkspaceContextValue = {
  root: WorkspaceFolder;
  activeFileId: string;
  activeFile: WorkspaceFile | null;
  openFiles: WorkspaceFile[];
  selectedFolderId: string;
  arenaPlayerCode: string;
  setArenaPlayerCode: React.Dispatch<React.SetStateAction<string>>;
  isTerminalOpen: boolean;
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  terminalEntries: TerminalEntry[];
  executionStatus: ExecutionStatus;
  setActiveFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  updateActiveFileContent: (content: string) => void;
  createFile: (folderId: string, fileName: string) => void;
  createFolder: (folderId: string, folderName: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleFolderOpen: (folderId: string) => void;
  openFolder: (folderId: string) => void;
  runMode: (mode: WorkspaceMode) => Promise<void>;
  appendTerminalEntry: (kind: TerminalEntryKind, text: string) => void;
};

const WORKSPACE_STORAGE_KEY = "code-along.workspace.v1";

// Data-channel topics for multiplayer workspace sync.
const TOPIC_WS_HELLO = "ws:hello";
const TOPIC_WS_STATE = "ws:state";
const TOPIC_WS_FILE = "ws:file";
const TOPIC_WS_TREE = "ws:tree";
const FILE_BROADCAST_THROTTLE_MS = 120;
const STATE_HANDSHAKE_TIMEOUT_MS = 3000;

type TreeOpMessage =
  | { op: "create"; folderId: string; node: WorkspaceNode }
  | { op: "delete"; nodeId: string };

const initialTerminalEntries: TerminalEntry[] = [
  { id: 1, kind: "system", text: "JavaScript runs instantly in the in-browser sandbox. Other languages use the Piston proxy." },
  { id: 2, kind: "system", text: "Use the explorer to create files and folders. Runnable files use their actual language." },
];

const arenaStarter = `// Your Code (JavaScript)
function solveChallenge(input) {
  // Write your solution here
  return input.split('').reverse().join('');
}`;

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createInitialWorkspace(): StoredWorkspaceState {
  const indexFile: WorkspaceFile = {
    id: makeId("file"),
    type: "file",
    name: "index.js",
    language: "javascript",
    content: `// Welcome to Code Along!
// Hit RUN CODE to execute this instantly in the sandbox,
// or hit JOIN ROOM to code together with live video.

function fibonacci(n) {
  const sequence = [0, 1];

  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }

  return sequence.slice(0, n);
}

console.log("Fibonacci:", fibonacci(10).join(", "));

const team = ["you", "your crew"];
console.log(\`Ready to code along with \${team.join(" + ")}!\`);`,
  };

  const stylesFile: WorkspaceFile = {
    id: makeId("file"),
    type: "file",
    name: "styles.css",
    language: "css",
    content: `body {
  margin: 0;
  background: #050505;
  color: white;
  font-family: "JetBrains Mono", monospace;
}`,
  };

  const serverFile: WorkspaceFile = {
    id: makeId("file"),
    type: "file",
    name: "server.py",
    language: "python",
    content: `def greet(name):
    print(f"Hello, {name}!")

greet("Code Along")`,
  };

  const packageFile: WorkspaceFile = {
    id: makeId("file"),
    type: "file",
    name: "package.json",
    language: "json",
    content: `{
  "name": "code-along",
  "version": "2.0.4",
  "private": true
}`,
  };

  const root: WorkspaceFolder = {
    id: "root",
    type: "folder",
    name: "CODE-ALONG",
    children: [indexFile, stylesFile, serverFile, packageFile],
  };

  return {
    root,
    activeFileId: indexFile.id,
    openFileIds: [indexFile.id, stylesFile.id],
  };
}

function parseStoredWorkspace(): StoredWorkspaceState {
  if (typeof window === "undefined") {
    return createInitialWorkspace();
  }

  const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);

  if (!raw) {
    return createInitialWorkspace();
  }

  try {
    return JSON.parse(raw) as StoredWorkspaceState;
  } catch {
    return createInitialWorkspace();
  }
}

function isFolder(node: WorkspaceNode): node is WorkspaceFolder {
  return node.type === "folder";
}

function findNodeById(node: WorkspaceNode, nodeId: string): WorkspaceNode | null {
  if (node.id === nodeId) {
    return node;
  }

  if (!isFolder(node)) {
    return null;
  }

  for (const child of node.children) {
    const match = findNodeById(child, nodeId);
    if (match) {
      return match;
    }
  }

  return null;
}

function collectFiles(node: WorkspaceNode): WorkspaceFile[] {
  if (!isFolder(node)) {
    return [node];
  }

  return node.children.flatMap((child) => collectFiles(child));
}

function updateNode(node: WorkspaceNode, nodeId: string, updater: (current: WorkspaceNode) => WorkspaceNode): WorkspaceNode {
  if (node.id === nodeId) {
    return updater(node);
  }

  if (!isFolder(node)) {
    return node;
  }

  return {
    ...node,
    children: node.children.map((child) => updateNode(child, nodeId, updater)),
  };
}

function insertIntoFolder(node: WorkspaceFolder, folderId: string, newNode: WorkspaceNode): WorkspaceFolder {
  if (node.id === folderId) {
    return { ...node, children: [...node.children, newNode] };
  }

  return {
    ...node,
    children: node.children.map((child) =>
      isFolder(child) ? insertIntoFolder(child, folderId, newNode) : child,
    ),
  };
}

function removeNode(node: WorkspaceFolder, nodeId: string): WorkspaceFolder {
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => (isFolder(child) ? removeNode(child, nodeId) : child)),
  };
}

function getFolderOrRoot(root: WorkspaceFolder, folderId: string) {
  const maybeFolder = findNodeById(root, folderId);
  return maybeFolder && isFolder(maybeFolder) ? maybeFolder : root;
}

function getNodeFileIds(node: WorkspaceNode | null): string[] {
  if (!node) {
    return [];
  }

  if (!isFolder(node)) {
    return [node.id];
  }

  return collectFiles(node).map((file) => file.id);
}

function getTemplateForLanguage(language: EditorLanguage) {
  if (language in CODE_TEMPLATES) {
    return CODE_TEMPLATES[language as keyof typeof CODE_TEMPLATES];
  }

  if (language === "json") {
    return "{\n  \n}";
  }

  if (language === "css") {
    return "/* styles */\n";
  }

  return "";
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [{ root, activeFileId, openFileIds }, setWorkspaceState] = useState<StoredWorkspaceState>(parseStoredWorkspace);
  const [selectedFolderId, setSelectedFolderId] = useState("root");
  const [arenaPlayerCode, setArenaPlayerCode] = useState(arenaStarter);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>(initialTerminalEntries);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("idle");
  const { isConnected, sendData, subscribeData } = useSessionCall();

  // Refs so data-channel handlers always read the latest workspace without re-subscribing.
  const workspaceRef = useRef<StoredWorkspaceState>({ root, activeFileId, openFileIds });
  workspaceRef.current = { root, activeFileId, openFileIds };
  const awaitingRemoteStateRef = useRef(false);
  const pendingFileBroadcastRef = useRef<Map<string, string>>(new Map());
  const fileBroadcastTimerRef = useRef<number | null>(null);

  const queueFileBroadcast = useCallback(
    (fileId: string, content: string) => {
      pendingFileBroadcastRef.current.set(fileId, content);

      if (fileBroadcastTimerRef.current !== null) {
        return;
      }

      fileBroadcastTimerRef.current = window.setTimeout(() => {
        fileBroadcastTimerRef.current = null;
        const batch = Array.from(pendingFileBroadcastRef.current.entries());
        pendingFileBroadcastRef.current.clear();

        for (const [pendingFileId, pendingContent] of batch) {
          sendData(TOPIC_WS_FILE, { fileId: pendingFileId, content: pendingContent });
        }
      }, FILE_BROADCAST_THROTTLE_MS);
    },
    [sendData],
  );

  // Flush guard: never leave a stale broadcast timer behind on unmount.
  useEffect(
    () => () => {
      if (fileBroadcastTimerRef.current !== null) {
        window.clearTimeout(fileBroadcastTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        WORKSPACE_STORAGE_KEY,
        JSON.stringify({ root, activeFileId, openFileIds }),
      );
    }
  }, [activeFileId, openFileIds, root]);

  // Multiplayer workspace sync: handshake with peers and apply their edits live.
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Ask peers for the authoritative workspace; keep ours if nobody answers.
    awaitingRemoteStateRef.current = true;
    sendData(TOPIC_WS_HELLO, {});
    const handshakeTimeout = window.setTimeout(() => {
      awaitingRemoteStateRef.current = false;
    }, STATE_HANDSHAKE_TIMEOUT_MS);

    const unsubscribes = [
      subscribeData(TOPIC_WS_HELLO, () => {
        if (awaitingRemoteStateRef.current) {
          return;
        }

        sendData(TOPIC_WS_STATE, workspaceRef.current);
      }),
      subscribeData(TOPIC_WS_STATE, (payload) => {
        if (!awaitingRemoteStateRef.current) {
          return;
        }

        const incoming = payload as StoredWorkspaceState;

        if (!incoming || incoming.root?.type !== "folder") {
          return;
        }

        awaitingRemoteStateRef.current = false;
        const incomingFiles = collectFiles(incoming.root);
        setWorkspaceState({
          root: incoming.root,
          activeFileId: incoming.activeFileId || incomingFiles[0]?.id || "",
          openFileIds:
            incoming.openFileIds?.length
              ? incoming.openFileIds
              : incomingFiles.slice(0, 1).map((file) => file.id),
        });
      }),
      subscribeData(TOPIC_WS_FILE, (payload) => {
        const { fileId, content } = (payload || {}) as { fileId?: string; content?: string };

        if (!fileId || typeof content !== "string") {
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          root: updateNode(current.root, fileId, (node) =>
            !isFolder(node) ? { ...node, content } : node,
          ) as WorkspaceFolder,
        }));
      }),
      subscribeData(TOPIC_WS_TREE, (payload) => {
        const message = payload as TreeOpMessage;

        if (message?.op === "create" && message.node) {
          setWorkspaceState((current) => {
            if (findNodeById(current.root, message.node.id)) {
              return current;
            }

            return { ...current, root: insertIntoFolder(current.root, message.folderId, message.node) };
          });
          return;
        }

        if (message?.op === "delete" && message.nodeId) {
          setWorkspaceState((current) => {
            const removedNode = findNodeById(current.root, message.nodeId);

            if (!removedNode) {
              return current;
            }

            const nextRoot = removeNode(current.root, message.nodeId);
            const remainingFiles = collectFiles(nextRoot);
            const removedFileIds = new Set(getNodeFileIds(removedNode));
            const nextOpenFileIds = current.openFileIds.filter((fileId) => !removedFileIds.has(fileId));
            const nextActiveFileId = removedFileIds.has(current.activeFileId)
              ? nextOpenFileIds[0] || remainingFiles[0]?.id || current.activeFileId
              : current.activeFileId;

            return { root: nextRoot, activeFileId: nextActiveFileId, openFileIds: nextOpenFileIds };
          });
        }
      }),
    ];

    return () => {
      window.clearTimeout(handshakeTimeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [isConnected, sendData, subscribeData]);

  const allFiles = useMemo(() => collectFiles(root), [root]);
  const activeFile = useMemo(() => {
    const file = allFiles.find((current) => current.id === activeFileId);
    return file || allFiles[0] || null;
  }, [activeFileId, allFiles]);
  const openFiles = useMemo(
    () => openFileIds.map((fileId) => allFiles.find((file) => file.id === fileId)).filter(Boolean) as WorkspaceFile[],
    [allFiles, openFileIds],
  );

  const appendTerminalEntry = useCallback((kind: TerminalEntryKind, text: string) => {
    setTerminalEntries((current) => [
      ...current,
      {
        id: current.length === 0 ? 1 : current[current.length - 1].id + 1,
        kind,
        text,
      },
    ]);
  }, []);

  const setActiveFile = useCallback((fileId: string) => {
    setWorkspaceState((current) => ({
      ...current,
      activeFileId: fileId,
      openFileIds: current.openFileIds.includes(fileId) ? current.openFileIds : [...current.openFileIds, fileId],
    }));
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setWorkspaceState((current) => {
      const nextOpenFileIds = current.openFileIds.filter((currentId) => currentId !== fileId);
      const remainingFiles = collectFiles(current.root).filter((file) => file.id !== fileId);
      const nextActiveFileId =
        current.activeFileId === fileId
          ? nextOpenFileIds[0] || remainingFiles[0]?.id || current.activeFileId
          : current.activeFileId;

      return {
        ...current,
        activeFileId: nextActiveFileId,
        openFileIds: nextOpenFileIds,
      };
    });
  }, []);

  const updateActiveFileContent = useCallback((content: string) => {
    if (!activeFile) {
      return;
    }

    setWorkspaceState((current) => ({
      ...current,
      root: updateNode(current.root, activeFile.id, (node) =>
        !isFolder(node) ? { ...node, content } : node,
      ) as WorkspaceFolder,
    }));
    queueFileBroadcast(activeFile.id, content);
  }, [activeFile, queueFileBroadcast]);

  const createFile = useCallback((folderId: string, fileName: string) => {
    const normalizedName = fileName.trim();

    if (!normalizedName) {
      return;
    }

    const language = getLanguageFromFileName(normalizedName);
    const newFile: WorkspaceFile = {
      id: makeId("file"),
      type: "file",
      name: normalizedName,
      language,
      content: getTemplateForLanguage(language),
    };

    setWorkspaceState((current) => ({
      root: insertIntoFolder(current.root, folderId, newFile),
      activeFileId: newFile.id,
      openFileIds: [...current.openFileIds, newFile.id],
    }));
    sendData(TOPIC_WS_TREE, { op: "create", folderId, node: newFile } satisfies TreeOpMessage);
  }, [sendData]);

  const createFolder = useCallback((folderId: string, folderName: string) => {
    const normalizedName = folderName.trim();

    if (!normalizedName) {
      return;
    }

    const newFolder: WorkspaceFolder = {
      id: makeId("folder"),
      type: "folder",
      name: normalizedName,
      children: [],
    };

    setWorkspaceState((current) => ({
      ...current,
      root: insertIntoFolder(current.root, folderId, newFolder),
    }));
    setSelectedFolderId(newFolder.id);
    sendData(TOPIC_WS_TREE, { op: "create", folderId, node: newFolder } satisfies TreeOpMessage);
  }, [sendData]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === "root") {
      return;
    }

    setWorkspaceState((current) => {
      const removedNode = findNodeById(current.root, nodeId);
      const nextRoot = removeNode(current.root, nodeId);
      const remainingFiles = collectFiles(nextRoot);
      const removedFileIds = new Set(getNodeFileIds(removedNode));
      const nextOpenFileIds = current.openFileIds.filter((fileId) => !removedFileIds.has(fileId));
      const nextActiveFileId = removedFileIds.has(current.activeFileId)
        ? nextOpenFileIds[0] || remainingFiles[0]?.id || current.activeFileId
        : current.activeFileId;

      return {
        root: nextRoot,
        activeFileId: nextActiveFileId,
        openFileIds: nextOpenFileIds,
      };
    });
    setSelectedFolderId("root");
    sendData(TOPIC_WS_TREE, { op: "delete", nodeId } satisfies TreeOpMessage);
  }, [sendData]);

  const toggleFolderOpen = useCallback((folderId: string) => {
    setSelectedFolderId((current) => (current === folderId ? "root" : folderId));
  }, []);

  const openFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId);
  }, []);

  const runMode = useCallback(
    async (mode: WorkspaceMode) => {
      if (executionStatus === "running") {
        return;
      }

      if (mode === "whiteboard") {
        setIsTerminalOpen(true);
        appendTerminalEntry("system", "Whiteboard mode has no runnable file. Switch to Collaborate or Arena.");
        return;
      }

      if (mode === "arena") {
        setIsTerminalOpen(true);
        setExecutionStatus("running");
        appendTerminalEntry("command", "$ run javascript arena.js");
        appendTerminalEntry("system", "Sandbox request started...");

        try {
          const result = await executeCode({
            language: "javascript",
            sourceCode: arenaPlayerCode,
            fileName: "arena.js",
          });

          appendTerminalEntry("output", result.trim() || "Program finished with no output.");
          setExecutionStatus("success");
        } catch (error) {
          appendTerminalEntry("error", error instanceof Error ? error.message : "Unknown execution error.");
          setExecutionStatus("error");
        }

        return;
      }

      if (!activeFile) {
        appendTerminalEntry("error", "No active file selected.");
        return;
      }

      if (!isRunnableLanguage(activeFile.language)) {
        setIsTerminalOpen(true);
        appendTerminalEntry(
          "system",
          `${activeFile.name} is ${LANGUAGE_LABELS[activeFile.language]} and is not runnable. Open a code file such as .js, .py, .java, .cpp, .go, or .php.`,
        );
        return;
      }

      setIsTerminalOpen(true);
      setExecutionStatus("running");
      appendTerminalEntry("command", `$ run ${activeFile.language} ${activeFile.name}`);
      appendTerminalEntry("system", "Sandbox request started...");

      try {
        const result = await executeCode({
          language: activeFile.language,
          sourceCode: activeFile.content,
          fileName: activeFile.name,
        });
        appendTerminalEntry("output", result.trim() || "Program finished with no output.");
        setExecutionStatus("success");
      } catch (error) {
        appendTerminalEntry("error", error instanceof Error ? error.message : "Unknown execution error.");
        setExecutionStatus("error");
      }
    },
    [activeFile, appendTerminalEntry, arenaPlayerCode, executionStatus],
  );

  const value = useMemo(
    () => ({
      root,
      activeFileId: activeFile?.id || activeFileId,
      activeFile,
      openFiles,
      selectedFolderId,
      arenaPlayerCode,
      setArenaPlayerCode,
      isTerminalOpen,
      setIsTerminalOpen,
      terminalEntries,
      executionStatus,
      setActiveFile,
      closeFile,
      updateActiveFileContent,
      createFile: (folderId: string, fileName: string) => createFile(getFolderOrRoot(root, folderId).id, fileName),
      createFolder: (folderId: string, folderName: string) => createFolder(getFolderOrRoot(root, folderId).id, folderName),
      deleteNode,
      toggleFolderOpen,
      openFolder,
      runMode,
      appendTerminalEntry,
    }),
    [
      activeFile,
      activeFileId,
      appendTerminalEntry,
      arenaPlayerCode,
      closeFile,
      createFile,
      createFolder,
      deleteNode,
      executionStatus,
      isTerminalOpen,
      openFiles,
      root,
      runMode,
      selectedFolderId,
      setActiveFile,
      terminalEntries,
      toggleFolderOpen,
      updateActiveFileContent,
      openFolder,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }

  return context;
}
