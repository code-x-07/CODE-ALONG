import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { SocialDrawer } from './components/SocialDrawer';
import { JoinRoomModal } from './components/JoinRoomModal';
import { FloatingCallPanel } from './components/FloatingCallPanel';

export default function Layout() {
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-neon-green selection:text-black">
      {/* Background Ambience - Optimized with GPU acceleration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px] will-change-transform" style={{ animation: 'float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px] will-change-transform" style={{ animation: 'float 10s ease-in-out infinite 2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-neon-green/5 rounded-full blur-[80px] will-change-transform" style={{ animation: 'float 12s ease-in-out infinite 4s' }} />
        <div
          className="absolute inset-0 opacity-20 brightness-100 contrast-150 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 0.8px, transparent 0.8px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TopNav onProfileClick={() => setIsSocialOpen(true)} />
        
        <main className="flex-1 overflow-hidden relative flex">
          <Outlet />
        </main>
      </div>

      <SocialDrawer 
        isOpen={isSocialOpen} 
        onClose={() => setIsSocialOpen(false)} 
      />

      <JoinRoomModal />
      <FloatingCallPanel />
    </div>
  );
}
