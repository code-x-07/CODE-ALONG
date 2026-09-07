import { useEffect, useRef, useState } from "react";
import { Check, Copy, Crown, Flag, Link2, Play, RotateCcw, Swords, Timer, UserPlus, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams } from "react-router-dom";
import clsx from "clsx";
import { Sidebar } from "../components/Sidebar";
import { CodeEditor } from "../components/CodeEditor";
import { CallParticipantTile } from "../components/CallParticipantTile";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSessionCall } from "../context/SessionCallContext";
import { useArena } from "../context/ArenaContext";
import { getChallengeById } from "../arena/challenges";

function formatClock(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function ArenaPage() {
  const { roomId: routeRoomId } = useParams();
  const { arenaPlayerCode, setArenaPlayerCode } = useWorkspace();
  const {
    activeRoomId,
    pendingRoomId,
    participants,
    isConnected,
    isConnecting,
    openJoinModal,
    shareUrl,
    copiedShareLink,
    errorMessage,
    stageRoom,
    copyShareLink,
    localIdentity,
  } = useSessionCall();
  const {
    match,
    status,
    scores,
    opponentCode,
    isSubmitting,
    lastSubmission,
    submissionError,
    remainingMs,
    startMatch,
    resetMatch,
    submitSolution,
  } = useArena();

  const openedFromUrlRef = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);
  const roomLabel = activeRoomId || pendingRoomId || "Create a room to start the duel";
  const localParticipant = participants.find((participant) => participant.isLocal);
  const opponentParticipant = remoteParticipants[0];
  const [selfPreviewPosition, setSelfPreviewPosition] = useState({ x: 16, y: 16 });

  const challenge = getChallengeById(match?.challengeId);
  const opponentLiveCode = opponentParticipant ? opponentCode[opponentParticipant.id] : undefined;
  const matchRunning = status === "countdown" || status === "active";
  const timerRatio = match && status === "active" ? remainingMs / match.durationMs : 1;
  const myScore = localIdentity ? scores[localIdentity] : undefined;
  const opponentScore = opponentParticipant ? scores[opponentParticipant.id] : undefined;

  const winnerIdentity = (() => {
    if (status !== "finished" || !localIdentity || !opponentParticipant) {
      return null;
    }

    const mine = scores[localIdentity];
    const theirs = scores[opponentParticipant.id];

    if (!mine && !theirs) {
      return null;
    }

    if ((mine?.passed || 0) !== (theirs?.passed || 0)) {
      return (mine?.passed || 0) > (theirs?.passed || 0) ? localIdentity : opponentParticipant.id;
    }

    if (mine && theirs) {
      return mine.timeMs <= theirs.timeMs ? localIdentity : opponentParticipant.id;
    }

    return mine ? localIdentity : opponentParticipant.id;
  })();

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const dragState = draggingRef.current;
      const stage = stageRef.current;

      if (!dragState || !stage) {
        return;
      }

      const bounds = stage.getBoundingClientRect();
      const previewWidth = 176;
      const previewHeight = 120;
      const nextX = event.clientX - bounds.left - dragState.offsetX;
      const nextY = event.clientY - bounds.top - dragState.offsetY;

      setSelfPreviewPosition({
        x: Math.max(12, Math.min(nextX, bounds.width - previewWidth - 12)),
        y: Math.max(12, Math.min(nextY, bounds.height - previewHeight - 12)),
      });
    }

    function handlePointerUp(event: PointerEvent) {
      if (draggingRef.current?.pointerId === event.pointerId) {
        draggingRef.current = null;
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const roomFromQuery =
      typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("room") : null;
    const incomingRoom = routeRoomId || roomFromQuery;

    if (!incomingRoom) {
      return;
    }

    stageRoom(incomingRoom);

    if (!isConnected && openedFromUrlRef.current !== incomingRoom) {
      openedFromUrlRef.current = incomingRoom;
      openJoinModal(incomingRoom);
    }
  }, [isConnected, openJoinModal, routeRoomId, stageRoom]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-transparent text-ink">
      <Sidebar />

      <div className="relative flex min-h-0 flex-1 flex-col bg-surface">
        <div className="border-b border-line bg-surface px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                <Swords className="h-4 w-4" />
                Arena Lobby
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">{roomLabel}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {match && (
                <div
                  className={clsx(
                    "flex items-center gap-2 rounded-panel border px-4 py-3 font-mono text-lg font-black tabular-nums",
                    status === "active" && remainingMs < 30_000
                      ? "border-bad/40 bg-bad/10 text-bad"
                      : "border-line bg-raised text-ink",
                  )}
                >
                  <Timer className="h-5 w-5" />
                  {status === "countdown" ? "GET READY" : formatClock(remainingMs)}
                </div>
              )}

              {!matchRunning ? (
                <button
                  onClick={startMatch}
                  disabled={!isConnected || !opponentParticipant}
                  title={!isConnected || !opponentParticipant ? "Both players must be in the room to start" : undefined}
                  className="inline-flex items-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ground disabled:cursor-not-allowed disabled:border-line disabled:bg-raised disabled:text-ink-faint"
                >
                  <Play className="h-4 w-4" />
                  {status === "finished" ? "Rematch" : "Start Match"}
                </button>
              ) : (
                <button
                  onClick={() => void submitSolution()}
                  disabled={status !== "active" || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" />
                  {isSubmitting ? "Judging..." : "Submit Solution"}
                </button>
              )}

              {match && (
                <button
                  onClick={resetMatch}
                  className="inline-flex items-center gap-2 rounded-panel border border-line bg-raised px-4 py-3 text-sm font-bold text-ink-muted transition-colors hover:bg-raised hover:text-ink"
                  title="Reset the match for both players"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={() => openJoinModal()}
                className="inline-flex items-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ground"
              >
                <UserPlus className="h-4 w-4" />
                {isConnected ? "Room" : "Create / Join"}
              </button>
            </div>
          </div>

          {/* Match strip: challenge + timer bar + scores */}
          {match && challenge && (
            <div className="mt-4 rounded-panel border border-line bg-raised px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-ink">{challenge.title}</span>
                    <span
                      className={clsx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                        challenge.difficulty === "easy" && "border-accent/40 text-accent",
                        challenge.difficulty === "medium" && "border-warn/40 text-warn",
                        challenge.difficulty === "hard" && "border-bad/40 text-bad",
                      )}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{challenge.prompt}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {[{ label: "You", score: myScore, accent: "text-accent", id: localIdentity }, { label: opponentParticipant?.name || "Opponent", score: opponentScore, accent: "text-accent", id: opponentParticipant?.id }].map(
                    (player) => (
                      <div
                        key={player.label}
                        className={clsx(
                          "rounded-panel border px-3 py-2 text-center",
                          winnerIdentity && winnerIdentity === player.id
                            ? "border-accent/40 bg-accent-subtle"
                            : "border-line bg-surface",
                        )}
                      >
                        <div className={clsx("flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em]", player.accent)}>
                          {winnerIdentity && winnerIdentity === player.id && <Crown className="h-3 w-3" />}
                          {player.label}
                        </div>
                        <div className="font-mono text-lg font-black tabular-nums text-ink">
                          {player.score ? `${player.score.passed}/${player.score.total}` : "—"}
                        </div>
                        {player.score && (
                          <div className="text-[10px] text-ink-faint">{formatClock(player.score.timeMs)} · {player.score.attempts} tries</div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {status === "active" && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-[width] duration-300",
                      remainingMs < 30_000 ? "bg-bad" : "bg-accent",
                    )}
                    style={{ width: `${Math.max(0, Math.min(1, timerRatio)) * 100}%` }}
                  />
                </div>
              )}

              {submissionError && (
                <div className="mt-3 rounded-panel border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
                  {submissionError}
                </div>
              )}

              {lastSubmission && !submissionError && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {lastSubmission.results.map((passed, index) => (
                    <span
                      key={index}
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-control border font-mono text-[11px] font-bold",
                        passed
                          ? "border-ok/40 bg-ok/10 text-ok"
                          : "border-bad/40 bg-bad/10 text-bad",
                      )}
                      title={`Test ${index + 1}: ${passed ? "passed" : "failed"}`}
                    >
                      {index + 1}
                    </span>
                  ))}
                  <span className="ml-1 text-ink-muted">
                    {lastSubmission.passed === lastSubmission.total ? "All tests green. Submitted!" : "Keep going — you can resubmit."}
                  </span>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-panel border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid min-h-full gap-4 lg:grid-cols-[minmax(0,1.7fr)_380px]">
            {/* Split-screen dual editors */}
            <section className="relative flex min-h-[520px] flex-col gap-4 lg:min-h-0">
              <div className="flex min-h-0 flex-1 flex-col rounded-panel border border-line bg-surface p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    Your Editor
                  </div>
                  <div className="rounded-full border border-line bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                    JavaScript
                  </div>
                </div>

                <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-panel border border-line bg-raised">
                  <CodeEditor
                    value={arenaPlayerCode}
                    onChange={setArenaPlayerCode}
                    language="javascript"
                    className="h-full bg-transparent"
                    readOnly={status === "countdown"}
                  />

                  {/* Countdown overlay */}
                  <AnimatePresence>
                    {status === "countdown" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-raised"
                      >
                        <motion.div
                          key={Math.ceil(remainingMs / 1000)}
                          initial={{ scale: 2.2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="font-mono text-8xl font-black text-accent"
                        >
                          {Math.max(1, Math.ceil(remainingMs / 1000))}
                        </motion.div>
                        <div className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-ink-muted">
                          {challenge?.title}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Opponent live editor */}
              <div className="flex min-h-0 flex-1 flex-col rounded-panel border border-line bg-surface p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                    <span className={clsx("h-2 w-2 rounded-full", opponentParticipant ? "bg-accent" : "bg-ink-faint")} />
                    {opponentParticipant ? `${opponentParticipant.name} · Live` : "Opponent Editor"}
                  </div>
                  <div className="rounded-full border border-line bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                    Read Only
                  </div>
                </div>

                <div className="min-h-[220px] flex-1 overflow-hidden rounded-panel border border-line bg-raised">
                  {opponentLiveCode !== undefined ? (
                    <CodeEditor
                      value={opponentLiveCode}
                      onChange={() => undefined}
                      language="javascript"
                      className="h-full bg-transparent opacity-90"
                      readOnly
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-ink-faint">
                      {opponentParticipant
                        ? "Waiting for your opponent to start typing…"
                        : "When an opponent joins, their code streams here live."}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="flex min-h-0 flex-col gap-4 pb-4 lg:pb-0">
              <section className="rounded-panel border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                      <Link2 className="h-4 w-4" />
                      Room Access
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">One host, one opponent.</div>
                  </div>
                  <div className="rounded-full border border-line bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                    {isConnecting ? "Connecting" : isConnected ? "Live" : "Offline"}
                  </div>
                </div>

                <div className="mt-4 rounded-panel border border-line bg-raised px-4 py-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-faint">Room Code</div>
                  <div className="mt-2 text-2xl font-black tracking-[0.08em] text-ink">
                    {activeRoomId || pendingRoomId || "CREATE ROOM"}
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  <button
                    onClick={() => void copyShareLink()}
                    disabled={!shareUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-ground disabled:cursor-not-allowed disabled:border-line disabled:bg-raised disabled:text-ink-faint"
                  >
                    {copiedShareLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedShareLink ? "Copied Link" : "Copy Invite Link"}
                  </button>
                </div>
              </section>

              <section className="flex min-h-[300px] flex-1 flex-col rounded-panel border border-line bg-surface p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-ink-muted">
                      <Video className="h-4 w-4" />
                      Live Video Stage
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {isConnected ? "Real-time room is live." : "Join a room to start the live call."}
                    </div>
                  </div>
                  <div className="rounded-full border border-line bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
                    {remoteParticipants.length > 0 ? "2 / 2" : localParticipant ? "1 / 2" : "0 / 2"}
                  </div>
                </div>

                {participants.length > 0 ? (
                  <div ref={stageRef} className="relative flex-1 overflow-hidden rounded-panel border border-line bg-raised">
                    {opponentParticipant ? (
                      <CallParticipantTile
                        key={opponentParticipant.id}
                        participant={opponentParticipant}
                        className="h-full rounded-none border-0"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <div className="text-lg font-black text-ink">Waiting for opponent video</div>
                        <div className="mt-2 max-w-sm text-sm text-ink-muted">
                          Your room is live. Share the invite link or room code so the second player can join.
                        </div>
                      </div>
                    )}

                    {localParticipant && (
                      <div
                        className="absolute z-20 cursor-grab active:cursor-grabbing"
                        style={{
                          left: selfPreviewPosition.x,
                          top: selfPreviewPosition.y,
                          width: 176,
                          height: 120,
                        }}
                        onPointerDown={(event) => {
                          const bounds = event.currentTarget.getBoundingClientRect();
                          draggingRef.current = {
                            pointerId: event.pointerId,
                            offsetX: event.clientX - bounds.left,
                            offsetY: event.clientY - bounds.top,
                          };
                        }}
                      >
                        <CallParticipantTile
                          participant={localParticipant}
                          compact
                          className="h-full rounded-panel border border-accent/40"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-panel border border-dashed border-line bg-raised px-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-panel border border-accent/40 bg-accent-subtle">
                      <Video className="h-7 w-7 text-accent" />
                    </div>
                    <div className="text-lg font-black text-ink">No live room yet</div>
                    <div className="mt-2 max-w-sm text-sm text-ink-muted">
                      Click Create / Join, share the code or link, then let your opponent join. The live video appears here.
                    </div>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
