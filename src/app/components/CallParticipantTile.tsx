import React, { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import { MicOff, VideoOff } from "lucide-react";
import { Track, TrackPublication } from "livekit-client";
import { CallParticipant } from "../context/SessionCallContext";

function findTrackPublication(participant: CallParticipant, kind: Track.Kind) {
  return Array.from(participant.participant?.trackPublications.values() || []).find(
    (publication) => publication.kind === kind && publication.track,
  ) as TrackPublication | undefined;
}

export const CallParticipantTile = React.memo(function CallParticipantTile({
  participant,
  className,
  compact = false,
}: {
  participant: CallParticipant;
  className?: string;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoPublication = useMemo(() => findTrackPublication(participant, Track.Kind.Video), [participant]);
  const audioPublication = useMemo(() => findTrackPublication(participant, Track.Kind.Audio), [participant]);

  useEffect(() => {
    const element = videoRef.current;
    const track = videoPublication?.track;

    if (!element || !track) {
      return;
    }

    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [videoPublication]);

  useEffect(() => {
    const element = audioRef.current;
    const track = audioPublication?.track;

    if (!element || !track || participant.isLocal) {
      return;
    }

    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [audioPublication, participant.isLocal]);

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-panel border border-line bg-raised",
        compact ? "h-28" : "h-56",
        className,
      )}
    >
      {videoPublication?.track && !participant.isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-raised">
          <div className="flex flex-col items-center gap-3 text-ink-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-panel border border-line bg-surface text-2xl font-black">
              {participant.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-sm font-bold tracking-wide">{participant.name}</div>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ground via-ground/40 to-transparent px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink">{participant.name}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            {participant.isLocal ? "You" : participant.status}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {participant.isMuted && (
            <span className="rounded-full bg-bad/10 p-2 text-bad">
              <MicOff className="h-3.5 w-3.5" />
            </span>
          )}
          {participant.isCameraOff && (
            <span className="rounded-full bg-bad/10 p-2 text-bad">
              <VideoOff className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>

      {!participant.isLocal && <audio ref={audioRef} autoPlay />}
    </div>
  );
});
