import React from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import clsx from "clsx";
import { motion } from "motion/react";
import { useSessionCall } from "../context/SessionCallContext";

const accentMap = {
  green: "border-neon-green text-neon-green shadow-[0_0_18px_rgba(57,255,20,0.25)]",
  pink: "border-neon-pink text-neon-pink shadow-[0_0_18px_rgba(255,20,147,0.25)]",
  cyan: "border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.25)]",
} as const;

export const FloatingCallPanel = React.memo(function FloatingCallPanel() {
  const {
    activeRoomId,
    participants,
    isConnected,
    micEnabled,
    cameraEnabled,
    leaveRoom,
    toggleMic,
    toggleCamera,
  } = useSessionCall();

  if (!isConnected || !activeRoomId) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="pointer-events-auto fixed bottom-6 right-6 z-40 w-[340px] rounded-3xl border border-white/10 bg-black/80 p-4 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-neon-green">Room Live</div>
          <div className="mt-1 text-lg font-black text-white">{activeRoomId}</div>
          <div className="mt-1 text-xs text-white/45">{participants.length} participants connected to this workspace</div>
        </div>

        <button
          onClick={leaveRoom}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300 transition-colors hover:bg-red-500 hover:text-white"
        >
          Leave
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {participants.slice(0, 4).map((participant) => (
          <div
            key={participant.id}
            className={clsx(
              "relative overflow-hidden rounded-2xl border bg-white/[0.03] p-3",
              accentMap[participant.accent],
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                {participant.status}
              </span>
              {participant.isMuted && <MicOff className="h-3.5 w-3.5 text-white/50" />}
            </div>

            <div className="flex items-center gap-3">
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className={clsx(
                  "h-12 w-12 rounded-2xl object-cover",
                  participant.isCameraOff && "opacity-40 grayscale",
                )}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">{participant.name}</div>
                <div className="text-[11px] text-white/45">
                  {participant.isLocal ? "This device" : participant.isCameraOff ? "Camera off" : "Video live"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Call Controls</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={clsx(
              "rounded-full border p-2 transition-colors",
              micEnabled
                ? "border-white/10 bg-white/5 text-white hover:border-neon-green/40 hover:text-neon-green"
                : "border-red-500/30 bg-red-500/10 text-red-300",
            )}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleCamera}
            className={clsx(
              "rounded-full border p-2 transition-colors",
              cameraEnabled
                ? "border-white/10 bg-white/5 text-white hover:border-cyan-400/40 hover:text-cyan-300"
                : "border-red-500/30 bg-red-500/10 text-red-300",
            )}
          >
            {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          <button
            onClick={leaveRoom}
            className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500 hover:text-white"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
});
