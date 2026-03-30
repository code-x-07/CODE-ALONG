import React, { useEffect, useRef } from "react";
import { Check, Copy, Link2, Radio, Swords, TimerReset, UserPlus, Video } from "lucide-react";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { CodeEditor } from "../components/CodeEditor";
import { CallParticipantTile } from "../components/CallParticipantTile";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSessionCall } from "../context/SessionCallContext";

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
  } = useSessionCall();
  const openedFromUrlRef = useRef<string | null>(null);
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);
  const visibleParticipants = participants.slice(0, 2);
  const roomLabel = activeRoomId || pendingRoomId || "Create a room to start the duel";
  const localParticipant = participants.find((participant) => participant.isLocal);
  const opponentParticipant = remoteParticipants[0];

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
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-transparent text-white">
      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-black/15">
        <div className="border-b border-white/5 bg-black/25 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
                <Swords className="h-4 w-4" />
                Arena Lobby
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                {roomLabel}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">
                Create one room, share the link or room code, and let exactly one opponent join you in the same live Arena.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => openJoinModal()}
                className="inline-flex items-center gap-2 rounded-2xl border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-sm font-bold text-neon-green transition-colors hover:bg-neon-green hover:text-black"
              >
                <Swords className="h-4 w-4" />
                Create Room
              </button>

              <button
                onClick={() => openJoinModal(activeRoomId || pendingRoomId || undefined)}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
              >
                <UserPlus className="h-4 w-4" />
                Join Room
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1.7fr)_380px]">
          <section className="flex min-h-0 flex-col rounded-[28px] border border-neon-green/15 bg-black/40 p-4 shadow-[0_0_30px_rgba(57,255,20,0.08)] backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
                  <span className="h-2 w-2 rounded-full bg-neon-green shadow-[0_0_10px_#39FF14]" />
                  Your Arena Editor
                </div>
                <div className="mt-1 text-sm text-white/45">
                  Run your active Arena code from the top bar while the room call stays live.
                </div>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                JavaScript
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-neon-green/20 bg-black/55">
              <CodeEditor
                value={arenaPlayerCode}
                onChange={setArenaPlayerCode}
                language="javascript"
                className="h-full bg-transparent"
              />
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-4">
            <section className="rounded-[28px] border border-white/10 bg-black/40 p-4 shadow-[0_0_30px_rgba(255,255,255,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                    <Link2 className="h-4 w-4" />
                    Room Access
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    One host, one opponent.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {isConnecting ? "Connecting" : isConnected ? "Live" : "Offline"}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Room Code</div>
                <div className="mt-2 text-2xl font-black tracking-[0.08em] text-white">
                  {activeRoomId || pendingRoomId || "CREATE ROOM"}
                </div>
              </div>

              {shareUrl && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Invite Link</div>
                  <div className="mt-2 break-all text-sm text-white/75">{shareUrl}</div>
                </div>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <button
                  onClick={() => void copyShareLink()}
                  disabled={!shareUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neon-green/30 bg-neon-green/10 px-4 py-3 text-sm font-bold text-neon-green transition-colors hover:bg-neon-green hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/30"
                >
                  {copiedShareLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedShareLink ? "Copied Link" : "Copy Invite Link"}
                </button>
                <button
                  onClick={() => openJoinModal()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
                >
                  <UserPlus className="h-4 w-4" />
                  Open Join Panel
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-neon-pink/15 bg-black/40 p-4 shadow-[0_0_30px_rgba(255,20,147,0.08)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-pink">
                    <Swords className="h-4 w-4" />
                    Two Player Lobby
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    We keep this room focused on two competitors.
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {remoteParticipants.length > 0 ? "2 / 2" : localParticipant ? "1 / 2" : "0 / 2"}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-neon-green/20 bg-white/[0.03] p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neon-green">Player 1</div>
                  {localParticipant ? (
                    <CallParticipantTile participant={localParticipant} compact />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                      Create or join the room from this device.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.03] p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">Player 2</div>
                  {opponentParticipant ? (
                    <CallParticipantTile participant={opponentParticipant} compact />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                      Waiting for your opponent to join with the room code.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="flex min-h-[300px] flex-col rounded-[28px] border border-cyan-400/15 bg-black/40 p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    <Video className="h-4 w-4" />
                    Live Video Stage
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {isConnected ? "Real-time room is live." : "Join a room to start the live call."}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {activeRoomId || "No room"}
                </div>
              </div>

              {visibleParticipants.length > 0 ? (
                <div className="grid flex-1 auto-rows-fr gap-3">
                  {visibleParticipants.map((participant) => (
                    <CallParticipantTile key={participant.id} participant={participant} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                    <Video className="h-7 w-7 text-cyan-300" />
                  </div>
                  <div className="text-lg font-black text-white">No live room yet</div>
                  <div className="mt-2 max-w-sm text-sm text-white/45">
                    Click Create Room, share the code or link, then let your opponent join. The live video appears here.
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
