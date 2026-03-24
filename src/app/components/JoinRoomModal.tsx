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
  } = useSessionCall();
  const [nameInput, setNameInput] = useState(displayName);
  const [roomInput, setRoomInput] = useState(activeRoomId || "");

  useEffect(() => {
    if (isJoinModalOpen) {
      setNameInput(displayName);
      setRoomInput(activeRoomId || "");
    }
  }, [activeRoomId, displayName, isJoinModalOpen]);

  return (
    <AnimatePresence>
      {isJoinModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJoinModal}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-black/85 p-7 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-6">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neon-green/20 bg-neon-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-neon-green">
                  <Video className="h-3.5 w-3.5" />
                  Live Call
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">Join by room code</h2>
                <p className="mt-2 text-sm text-white/50">
                  Use the same room code for Collaborate and Arena so the call follows the session.
                </p>
              </div>

              <button
                onClick={closeJoinModal}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/50 transition-colors hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Display Name
                </span>
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder="Hemant"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/20 focus:border-neon-green/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                  Room Code
                </span>
                <input
                  value={roomInput}
                  onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
                  placeholder="CA-82KD4P"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/20 focus:border-neon-green/50"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => createRoom(nameInput)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-sm font-bold text-neon-green transition-colors hover:bg-neon-green hover:text-black"
              >
                <Plus className="h-4 w-4" />
                Create New Room
              </button>

              <button
                onClick={() => joinRoom(roomInput, nameInput)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
              >
                <Link2 className="h-4 w-4" />
                Join Existing Room
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
