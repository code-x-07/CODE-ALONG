import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Copy, LogOut, Pencil, Radio, Users, Zap } from 'lucide-react';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { useSessionCall } from '../context/SessionCallContext';

interface SocialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT_TEXT: Record<string, string> = {
  green: 'text-neon-green',
  pink: 'text-neon-pink',
  cyan: 'text-cyan-300',
};

const ACCENT_BG: Record<string, string> = {
  green: 'from-neon-green/30',
  pink: 'from-neon-pink/30',
  cyan: 'from-cyan-400/30',
};

export const SocialDrawer = React.memo(function SocialDrawer({ isOpen, onClose }: SocialDrawerProps) {
  const {
    displayName,
    setDisplayName,
    participants,
    isConnected,
    activeRoomId,
    shareUrl,
    copyShareLink,
    copiedShareLink,
    openJoinModal,
    leaveRoom,
  } = useSessionCall();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const commitName = useCallback(() => {
    setDisplayName(nameDraft);
    setIsEditingName(false);
  }, [nameDraft, setDisplayName]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 w-[320px] bg-black/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-green" />
                <h2 className="text-sm font-bold tracking-widest text-white uppercase">Session</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Profile Section */}
              <div className="flex flex-col items-center gap-4 text-center relative group">
                <div className="relative w-24 h-24 rounded-full p-1 border border-white/10 group-hover:border-neon-green/50 transition-colors shadow-2xl">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-neon-green/30 via-black to-cyan-400/30 font-mono text-2xl font-black text-neon-green">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={clsx(
                      'absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black',
                      isConnected ? 'bg-neon-green shadow-[0_0_10px_#39FF14]' : 'bg-gray-500',
                    )}
                  />
                </div>

                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && commitName()}
                      className="w-40 rounded-lg border border-neon-green/40 bg-black/60 px-3 py-1.5 text-center text-sm font-bold text-white outline-none"
                      maxLength={24}
                    />
                    <button onClick={commitName} className="rounded-full bg-neon-green/20 p-1.5 text-neon-green hover:bg-neon-green hover:text-black transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNameDraft(displayName);
                      setIsEditingName(true);
                    }}
                    className="group/name flex items-center gap-2"
                  >
                    <h3 className="text-xl font-bold text-white tracking-tight">{displayName}</h3>
                    <Pencil className="h-3.5 w-3.5 text-white/30 transition-colors group-hover/name:text-neon-green" />
                  </button>
                )}

                <div
                  className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide',
                    isConnected
                      ? 'bg-neon-green/10 border-neon-green/20 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]'
                      : 'bg-white/5 border-white/10 text-white/40',
                  )}
                >
                  <Radio className="w-3 h-3" />
                  {isConnected ? `LIVE · ${activeRoomId}` : 'NOT IN A ROOM'}
                </div>
              </div>

              {/* Room participants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    In this room ({participants.length})
                  </h4>
                  <button
                    onClick={() => {
                      onClose();
                      openJoinModal();
                    }}
                    className="text-[10px] text-neon-green hover:underline"
                  >
                    {isConnected ? 'Switch Room' : 'Join Room +'}
                  </button>
                </div>

                {participants.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">
                    <Users className="mx-auto mb-3 h-6 w-6 text-white/20" />
                    Nobody here yet. Create or join a room to see teammates, share code, and go live.
                  </div>
                )}

                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                        <div
                          className={clsx(
                            'flex h-full w-full items-center justify-center bg-gradient-to-br via-black to-black/60 font-mono text-xs font-black',
                            ACCENT_BG[participant.accent],
                            ACCENT_TEXT[participant.accent],
                          )}
                        >
                          {participant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div
                          className={clsx(
                            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black',
                            participant.status === 'live' ? 'bg-neon-green shadow-[0_0_5px_#39FF14]' : 'bg-amber-400',
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {participant.name}
                          {participant.isLocal && <span className="ml-1 text-[10px] text-white/40">(you)</span>}
                        </p>
                        <p className={clsx('text-[10px] font-medium', ACCENT_TEXT[participant.accent])}>
                          {participant.isCameraOff ? 'Camera off' : 'On camera'} · {participant.isMuted ? 'Muted' : 'Mic on'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Room actions */}
              {isConnected && (
                <div className="space-y-3">
                  <button
                    onClick={() => void copyShareLink()}
                    disabled={!shareUrl}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neon-green/30 bg-neon-green/10 px-4 py-2.5 text-xs font-bold text-neon-green transition-colors hover:bg-neon-green hover:text-black disabled:opacity-40"
                  >
                    {copiedShareLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedShareLink ? 'Invite Link Copied' : 'Copy Invite Link'}
                  </button>
                  <button
                    onClick={() => {
                      leaveRoom();
                      onClose();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Leave Room
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
