import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSessionCall } from "./SessionCallContext";

export type WhiteboardTool = "select" | "pen" | "eraser" | "rect" | "text";

export type WhiteboardOp =
  | { id: string; author: string; kind: "stroke"; tool: "pen" | "eraser"; color: string; size: number; points: number[] }
  | { id: string; author: string; kind: "rect"; color: string; x: number; y: number; w: number; h: number }
  | { id: string; author: string; kind: "text"; color: string; x: number; y: number; text: string; fontSize: number }
  | { id: string; author: string; kind: "clear" };

type WhiteboardContextValue = {
  ops: WhiteboardOp[];
  /** In-progress strokes from remote peers, keyed by op id. */
  livePreviews: Map<string, WhiteboardOp>;
  commitOp: (op: WhiteboardOp) => void;
  streamProgress: (op: WhiteboardOp) => void;
  undoLastOwnOp: (author: string) => void;
  clearBoard: (author: string) => void;
  /** Bumped whenever remote data changes so canvases know to repaint. */
  revision: number;
};

const TOPIC_WB_HELLO = "wb:hello";
const TOPIC_WB_STATE = "wb:state";
const TOPIC_WB_OP = "wb:op";
const TOPIC_WB_PROGRESS = "wb:progress";
const TOPIC_WB_REMOVE = "wb:remove";
const STATE_HANDSHAKE_TIMEOUT_MS = 3000;

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null);

export function makeOpId() {
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function WhiteboardProvider({ children }: { children: React.ReactNode }) {
  const [ops, setOps] = useState<WhiteboardOp[]>([]);
  const [revision, setRevision] = useState(0);
  const livePreviewsRef = useRef<Map<string, WhiteboardOp>>(new Map());
  const awaitingRemoteStateRef = useRef(false);
  const opsRef = useRef<WhiteboardOp[]>(ops);
  opsRef.current = ops;
  const { isConnected, sendData, subscribeData } = useSessionCall();

  const bumpRevision = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    awaitingRemoteStateRef.current = true;
    sendData(TOPIC_WB_HELLO, {});
    const handshakeTimeout = window.setTimeout(() => {
      awaitingRemoteStateRef.current = false;
    }, STATE_HANDSHAKE_TIMEOUT_MS);

    const unsubscribes = [
      subscribeData(TOPIC_WB_HELLO, () => {
        if (awaitingRemoteStateRef.current) {
          return;
        }

        sendData(TOPIC_WB_STATE, { ops: opsRef.current });
      }),
      subscribeData(TOPIC_WB_STATE, (payload) => {
        if (!awaitingRemoteStateRef.current) {
          return;
        }

        const incoming = (payload as { ops?: WhiteboardOp[] })?.ops;

        if (!Array.isArray(incoming)) {
          return;
        }

        awaitingRemoteStateRef.current = false;
        setOps(incoming);
      }),
      subscribeData(TOPIC_WB_OP, (payload) => {
        const op = payload as WhiteboardOp;

        if (!op?.id || !op.kind) {
          return;
        }

        livePreviewsRef.current.delete(op.id);
        setOps((current) => (current.some((existing) => existing.id === op.id) ? current : [...current, op]));
      }),
      subscribeData(TOPIC_WB_PROGRESS, (payload) => {
        const op = payload as WhiteboardOp;

        if (!op?.id || !op.kind) {
          return;
        }

        livePreviewsRef.current.set(op.id, op);
        bumpRevision();
      }),
      subscribeData(TOPIC_WB_REMOVE, (payload) => {
        const { id } = (payload || {}) as { id?: string };

        if (!id) {
          return;
        }

        livePreviewsRef.current.delete(id);
        setOps((current) => current.filter((op) => op.id !== id));
      }),
    ];

    return () => {
      window.clearTimeout(handshakeTimeout);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [bumpRevision, isConnected, sendData, subscribeData]);

  const commitOp = useCallback(
    (op: WhiteboardOp) => {
      livePreviewsRef.current.delete(op.id);
      setOps((current) => [...current, op]);
      sendData(TOPIC_WB_OP, op);
    },
    [sendData],
  );

  const streamProgress = useCallback(
    (op: WhiteboardOp) => {
      // Lossy on purpose: dropped preview frames are fine, the commit is reliable.
      sendData(TOPIC_WB_PROGRESS, op, false);
    },
    [sendData],
  );

  const undoLastOwnOp = useCallback(
    (author: string) => {
      const own = [...opsRef.current].reverse().find((op) => op.author === author);

      if (!own) {
        return;
      }

      setOps((current) => current.filter((op) => op.id !== own.id));
      sendData(TOPIC_WB_REMOVE, { id: own.id });
    },
    [sendData],
  );

  const clearBoard = useCallback(
    (author: string) => {
      commitOp({ id: makeOpId(), author, kind: "clear" });
    },
    [commitOp],
  );

  const value = useMemo(
    () => ({
      ops,
      livePreviews: livePreviewsRef.current,
      commitOp,
      streamProgress,
      undoLastOwnOp,
      clearBoard,
      revision,
    }),
    [clearBoard, commitOp, ops, revision, streamProgress, undoLastOwnOp],
  );

  return <WhiteboardContext.Provider value={value}>{children}</WhiteboardContext.Provider>;
}

export function useWhiteboard() {
  const context = useContext(WhiteboardContext);

  if (!context) {
    throw new Error("useWhiteboard must be used within a WhiteboardProvider.");
  }

  return context;
}
