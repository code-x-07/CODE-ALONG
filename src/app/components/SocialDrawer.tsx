import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Copy, LogOut, Pencil, Radio, Users, Zap } from 'lucide-react';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { useSessionCall } from '../context/SessionCallContext';

interface SocialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

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
            className="fixed inset-0 bg-ground/80 z-50"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 w-[320px] bg-surface border-l border-line z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-line bg-raised">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-ink-muted" />
                <h2 className="text-sm font-bold tracking-widest text-ink uppercase">Session</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-raised text-ink-faint hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Profile Section */}
              <div className="flex flex-col items-center gap-4 text-center relative group">
                <div className="relative w-24 h-24 rounded-full p-1 border border-line group-hover:border-accent/40 transition-colors">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-raised font-mono text-2xl font-black text-ink">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className={clsx(
                      'absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-ground',
                      isConnected ? 'bg-accent' : 'bg-ink-faint',
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
                      className="w-40 rounded-control border border-accent/40 bg-raised px-3 py-1.5 text-center text-sm font-bold text-ink outline-none"
                      maxLength={24}
                    />
                    <button onClick={commitName} className="rounded-full bg-accent-subtle p-1.5 text-accent transition-colors hover:bg-accent hover:text-ground">
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
                    <h3 className="text-xl font-bold text-ink tracking-tight">{displayName}</h3>
                    <Pencil className="h-3.5 w-3.5 text-ink-faint transition-colors group-hover/name:text-ink" />
                  </button>
                )}

                <div
                  className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide',
                    isConnected
                      ? 'bg-accent-subtle border-accent/40 text-accent'
                      : 'bg-raised border-line text-ink-faint',
                  )}
                >
                  <Radio className="w-3 h-3" />
                  {isConnected ? `LIVE · ${activeRoomId}` : 'NOT IN A ROOM'}
                </div>
              </div>

              {/* Room participants */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <h4 className="text-xs font-bold text-ink-faint uppercase tracking-widest">
                    In this room ({participants.length})
                  </h4>
                  <button
                    onClick={() => {
                      onClose();
                      openJoinModal();
                    }}
                    className="text-[10px] text-ink-muted hover:text-ink hover:underline"
                  >
                    {isConnected ? 'Switch Room' : 'Join Room +'}
                  </button>
                </div>

                {participants.length === 0 && (
                  <div className="rounded-panel border border-dashed border-line px-4 py-8 text-center text-xs text-ink-faint">
                    <Users className="mx-auto mb-3 h-6 w-6 text-ink-faint" />
                    Nobody here yet. Create or join a room to see teammates, share code, and go live.
                  </div>
                )}

                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-control hover:bg-raised transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full border border-line overflow-hidden">
                        <div className="flex h-full w-full items-center justify-center bg-raised font-mono text-xs font-black text-ink-muted">
                          {participant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div
                          className={clsx(
                            'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-ground',
                            participant.status === 'live' ? 'bg-accent' : 'bg-ink-faint',
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {participant.name}
                          {participant.isLocal && <span className="ml-1 text-[10px] text-ink-faint">(you)</span>}
                        </p>
                        <p className="text-[10px] font-medium text-ink-faint">
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
                    className="w-full inline-flex items-center justify-center gap-2 rounded-panel border border-accent/40 bg-accent-subtle px-4 py-2.5 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-ground disabled:opacity-40"
                  >
                    {copiedShareLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedShareLink ? 'Invite Link Copied' : 'Copy Invite Link'}
                  </button>
                  <button
                    onClick={() => {
                      leaveRoom();
                      onClose();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-panel border border-bad/40 bg-bad/10 px-4 py-2.5 text-xs font-bold text-bad transition-colors hover:bg-bad hover:text-ground"
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
