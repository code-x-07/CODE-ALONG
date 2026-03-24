import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, UserPlus, Circle, MessageSquare, Zap } from 'lucide-react';
import clsx from 'clsx';
import React, { useCallback } from 'react';

interface SocialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocialDrawer = React.memo(function SocialDrawer({ isOpen, onClose }: SocialDrawerProps) {
  // Memoize backdrop click handler
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

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
                <h2 className="text-sm font-bold tracking-widest text-white uppercase">Social Hub</h2>
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
                <div className="absolute inset-0 bg-gradient-to-b from-neon-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                
                <div className="relative w-24 h-24 rounded-full p-1 border border-white/10 group-hover:border-neon-green/50 transition-colors shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
                    alt="User" 
                    className="w-full h-full rounded-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-neon-green rounded-full border-2 border-black shadow-[0_0_10px_#39FF14]" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 tracking-tight">CyberUser_99</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                    <Trophy className="w-3 h-3 fill-current" />
                    RANK #42
                  </div>
                </div>
              </div>

              {/* Friends List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Friends (2)
                  </h4>
                  <span className="text-[10px] text-neon-green cursor-pointer hover:underline">Add Friend +</span>
                </div>
                
                {/* Friend 1: Abhisht (Online) */}
                <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="Friend" className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neon-green rounded-full border-2 border-black shadow-[0_0_5px_#39FF14]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-neon-green transition-colors">Abhisht</p>
                      <p className="text-[10px] text-neon-green font-medium">Coding (JS)...</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-full bg-white/10 hover:bg-neon-green hover:text-black transition-colors">
                      <MessageSquare className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 rounded-full bg-white/10 hover:bg-neon-green hover:text-black transition-colors">
                      <UserPlus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Friend 2: Maya (Offline) */}
                <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer opacity-60 hover:opacity-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-gray-800 border border-white/10 overflow-hidden grayscale">
                       <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="Friend" className="w-full h-full object-cover" />
                       <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-black" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Maya</p>
                      <p className="text-[10px] text-white/40 font-medium">Offline 2h ago</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});