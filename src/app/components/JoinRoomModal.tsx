import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link2, Plus, Video } from "lucide-react";
import { useSessionCall } from "../context/SessionCallContext";

export const JoinRoomModal = React.memo(function JoinRoomModal() {
  const {
    isJoinModalOpen,
    closeJoinModal,
    createRoom,
    joinRoom,
    displayName,
    activeRoomId,
    pendingRoomId,
    isConnecting,
    connectionError,
  } = useSessionCall();
  const [nameInput, setNameInput] = useState(displayName);
  const [roomInput, setRoomInput] = useState(activeRoomId || pendingRoomId || "");

  useEffect(() => {
    if (isJoinModalOpen) {
      setNameInput(displayName);
      setRoomInput(activeRoomId || pendingRoomId || "");
    }
  }, [activeRoomId, displayName, isJoinModalOpen, pendingRoomId]);

  async function handleCreateRoom() {
    await createRoom(nameInput);
  }

  async function handleJoinRoom() {
    if (!roomInput.trim()) {
      return;
    }

    await joinRoom(roomInput, nameInput);
  }

  return (
    <AnimatePresence>
      {isJoinModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJoinModal}
            className="fixed inset-0 bg-ground/80 z-[55]"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 z-[60] max-h-[min(90vh,760px)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel border border-line bg-surface p-7 custom-scrollbar"
          >
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">
                  <Video className="h-3.5 w-3.5" />
                  Arena Lobby
                </div>
                <h2 className="text-2xl font-black tracking-tight text-ink">Create or join room</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Person 1 creates the room and shares the link or code. Person 2 joins using that exact code.
                </p>
              </div>

              <button
                onClick={closeJoinModal}
                disabled={isConnecting}
                className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
                  Display Name
                </span>
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Hemant"
                  className="w-full rounded-panel border border-line bg-raised px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-ink-faint">
                  Room Code
                </span>
                <input
                  value={roomInput}
                  onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
                  placeholder="CA-82KD4P"
                  className="w-full rounded-panel border border-line bg-raised px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent/40"
                />
              </label>
            </div>

            <div className="mt-4 rounded-panel border border-line bg-raised px-4 py-3 text-xs text-ink-muted">
              Rooms hold up to 8 people. Arena duels pit you against the first opponent who joins.
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => void handleCreateRoom()}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ground"
              >
                <Plus className="h-4 w-4" />
                {isConnecting ? "Connecting..." : "Create New Room"}
              </button>

              <button
                onClick={() => void handleJoinRoom()}
                disabled={isConnecting || !roomInput.trim()}
                className="flex items-center justify-center gap-2 rounded-panel border border-line bg-raised px-4 py-3 text-sm font-bold text-ink-muted transition-colors hover:bg-raised hover:text-ink"
              >
                <Link2 className="h-4 w-4" />
                {isConnecting ? "Connecting..." : "Join Existing Room"}
              </button>
            </div>

            {connectionError && (
              <div className="mt-4 rounded-panel border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
                {connectionError}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
