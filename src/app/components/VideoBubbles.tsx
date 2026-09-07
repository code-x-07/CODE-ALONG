import clsx from 'clsx';
import React from 'react';
import { useSessionCall } from '../context/SessionCallContext';

interface VideoBubblesProps {
  className?: string;
  stacked?: boolean; // If true, first bubble has -margin-right (overlap). If false, no overlap.
}

export const VideoBubbles = React.memo(function VideoBubbles({ className, stacked = true }: VideoBubblesProps) {
  const { participants, isConnected, openJoinModal } = useSessionCall();
  const visibleParticipants = participants.slice(0, 2);

  if (!isConnected || visibleParticipants.length === 0) {
    return (
      <button
        onClick={() => openJoinModal()}
        className={clsx(
          "pointer-events-auto rounded-panel border border-line bg-surface px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-accent/40 hover:text-accent",
          className,
        )}
      >
        Join room
      </button>
    );
  }

  return (
    <div className={clsx("flex items-center justify-center pointer-events-none", className)}>
      {visibleParticipants.map((participant, index) => (
        <div 
          key={participant.id}
          className={clsx(
            "relative w-20 h-20 rounded-full border-2 overflow-hidden bg-ground will-change-transform",
            participant.accent === "green" && "border-accent z-20",
            participant.accent === "pink" && "border-accent z-10",
            participant.accent === "cyan" && "border-accent z-10",
            stacked && index === 0 && "mr-[-20px]",
          )}
          style={{ animation: `fadeInScale 0.3s ease-out ${index * 0.1}s backwards` }}
        >
          {participant.avatarUrl ? (
            <img 
              src={participant.avatarUrl}
              alt={participant.name}
              className={clsx("w-full h-full object-cover", participant.isCameraOff && "opacity-40 grayscale")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#13361f,transparent_60%),linear-gradient(135deg,#050505,#10131a)]">
              <span className="text-2xl font-black text-ink">
                {participant.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div
            className={clsx(
              "absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-surface px-2 py-0.5 text-[10px] font-bold text-ink",
              participant.accent === "green" && "text-ink",
              participant.accent === "pink" && "text-ink",
              participant.accent === "cyan" && "text-ink",
            )}
          >
            {participant.name}
          </div>
        </div>
      ))}
    </div>
  );
});
