import React from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import clsx from "clsx";
import { motion } from "motion/react";
import { useSessionCall } from "../context/SessionCallContext";
import { CallParticipantTile } from "./CallParticipantTile";

const accentMap = {
  green: "border-line",
  pink: "border-line",
  cyan: "border-line",
} as const;

export const FloatingCallPanel = React.memo(function FloatingCallPanel() {
  const {
    activeRoomId,
    participants,
    isConnected,
    isConnecting,
    micEnabled,
    cameraEnabled,
    errorMessage,
    leaveRoom,
    toggleMic,
    toggleCamera,
  } = useSessionCall();

  if (!activeRoomId) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="pointer-events-auto fixed bottom-6 right-6 z-40 w-[340px] rounded-panel border border-line bg-surface p-4"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-muted">Room Live</div>
          <div className="mt-1 text-lg font-black text-ink">{activeRoomId}</div>
          <div className="mt-1 text-xs text-ink-faint">
            {isConnecting
              ? "Joining LiveKit room..."
              : isConnected
                ? `${participants.length} participants connected to this workspace`
                : "Room disconnected"}
          </div>
        </div>

        <button
          onClick={leaveRoom}
          className="rounded-full border border-bad/40 bg-bad/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-bad transition-colors hover:bg-bad hover:text-ground"
        >
          Leave
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {participants.slice(0, 4).map((participant) => (
          <CallParticipantTile
            key={participant.id}
            participant={participant}
            compact
            className={clsx("rounded-panel", accentMap[participant.accent])}
          />
        ))}
      </div>

      {errorMessage && (
        <div className="mt-3 rounded-panel border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad">
          {errorMessage}
        </div>
      )}

      {!participants.length && (
        <div className="mt-3 rounded-panel border border-line bg-raised px-3 py-3 text-xs text-ink-muted">
          Waiting for the first participant video track.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-panel border border-line bg-raised px-3 py-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">Call Controls</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={clsx(
              "rounded-full border p-2 transition-colors",
              micEnabled
                ? "border-line bg-raised text-ink hover:border-accent/40 hover:text-accent"
                : "border-line bg-surface text-ink-faint",
            )}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          <button
            onClick={toggleCamera}
            className={clsx(
              "rounded-full border p-2 transition-colors",
              cameraEnabled
                ? "border-line bg-raised text-ink hover:border-accent/40 hover:text-accent"
                : "border-line bg-surface text-ink-faint",
            )}
          >
            {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          <button
            onClick={leaveRoom}
            className="rounded-full border border-bad/40 bg-bad/10 p-2 text-bad transition-colors hover:bg-bad hover:text-ground"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
});
