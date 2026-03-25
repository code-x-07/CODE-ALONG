import React from "react";
import { Radio, Swords, TimerReset, UserPlus, Video } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { CodeEditor } from "../components/CodeEditor";
import { CallParticipantTile } from "../components/CallParticipantTile";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSessionCall } from "../context/SessionCallContext";

export default function ArenaPage() {
  const { arenaPlayerCode, setArenaPlayerCode } = useWorkspace();
  const {
    activeRoomId,
    participants,
    isConnected,
    isConnecting,
    openJoinModal,
    errorMessage,
  } = useSessionCall();
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);

  return (
    <div className="relative flex h-[calc(100vh-64px)] flex-1 overflow-hidden bg-transparent text-white">
      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden bg-black/15">
        <div className="border-b border-white/5 bg-black/25 px-5 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-green">
                <Swords className="h-4 w-4" />
                Arena Match Room
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                {activeRoomId || "Create a room to start the duel"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">
                Join the same room code with your opponent so the video call, presence, and Arena session stay locked to one match.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Call Status</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                  <Radio className="h-4 w-4 text-cyan-300" />
                  {isConnecting ? "Connecting" : isConnected ? "Live" : "Offline"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Players</div>
                <div className="mt-1 text-sm font-bold text-white">{participants.length || 0} connected</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Clock</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                  <TimerReset className="h-4 w-4 text-neon-pink" />
                  Ready to start
                </div>
              </div>

              <button
                onClick={openJoinModal}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
              >
                <UserPlus className="h-4 w-4" />
                {activeRoomId ? "Switch Room" : "Join Arena Room"}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="grid flex-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.95fr)]">
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
            <section className="flex min-h-[300px] flex-col rounded-[28px] border border-cyan-400/15 bg-black/40 p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                    <Video className="h-4 w-4" />
                    Live Video Stage
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {isConnected
                      ? "Participants inside this Arena room."
                      : "Join a room to start the video stage."}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {activeRoomId || "No room"}
                </div>
              </div>

              {participants.length > 0 ? (
                <div className="grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {participants.slice(0, 4).map((participant) => (
                    <CallParticipantTile key={participant.id} participant={participant} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                    <Video className="h-7 w-7 text-cyan-300" />
                  </div>
                  <div className="text-lg font-black text-white">Arena room not connected</div>
                  <div className="mt-2 max-w-sm text-sm text-white/45">
                    Create or join a room code. Once LiveKit connects, participant cameras and microphones will appear here.
                  </div>
                  <button
                    onClick={openJoinModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300 transition-colors hover:bg-cyan-400 hover:text-black"
                  >
                    <UserPlus className="h-4 w-4" />
                    Join Arena Room
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-neon-pink/15 bg-black/40 p-4 shadow-[0_0_30px_rgba(255,20,147,0.08)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neon-pink">
                <Swords className="h-4 w-4" />
                Match Telemetry
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Opponent Slots</div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {remoteParticipants.length > 0 ? `${remoteParticipants.length} opponent(s) joined` : "Waiting for opponent"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Room Sync</div>
                  <div className="mt-1 text-sm font-bold text-white">
                    {isConnected ? "LiveKit room active" : isConnecting ? "Joining room..." : "Disconnected"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                  This page is now structured as a real room stage. Shared opponent editor sync and live match state can layer onto this room id next.
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
