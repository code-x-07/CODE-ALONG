import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { SocialDrawer } from './components/SocialDrawer';
import { JoinRoomModal } from './components/JoinRoomModal';
import { FloatingCallPanel } from './components/FloatingCallPanel';

export type LayoutOutletContext = { isSidebarOpen: boolean };

export default function Layout() {
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ground font-sans text-ink selection:bg-accent selection:text-ground">
      <TopNav
        onProfileClick={() => setIsSocialOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      <main className="relative flex flex-1 overflow-hidden">
        <Outlet context={{ isSidebarOpen }} />
      </main>

      <SocialDrawer isOpen={isSocialOpen} onClose={() => setIsSocialOpen(false)} />
      <JoinRoomModal />
      <FloatingCallPanel />
    </div>
  );
}
