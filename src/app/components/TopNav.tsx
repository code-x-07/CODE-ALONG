import { Link, useLocation } from "react-router-dom";
import { Zap, Play, Code2, Swords, PenTool } from "lucide-react";
import { motion } from "motion/react";
import clsx from "clsx";
import React from "react";

interface TopNavProps {
  onProfileClick: () => void;
}

export const TopNav = React.memo(function TopNav({ onProfileClick }: TopNavProps) {
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "collaborate";

  const tabs = [
    { id: "collaborate", label: "Collaborate", path: "/collaborate", icon: <Code2 className="w-4 h-4" /> },
    { id: "arena", label: "Arena", path: "/arena", icon: <Swords className="w-4 h-4" /> },
    { id: "whiteboard", label: "Whiteboard", path: "/whiteboard", icon: <PenTool className="w-4 h-4" /> },
  ];

  return (
    <nav className="h-16 w-full flex items-center justify-between px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl z-50 relative">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-neon-green/50 blur-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-10 h-10 bg-black border border-white/10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.15)] group-hover:border-neon-green/50 transition-colors">
            <Zap className="w-5 h-5 text-neon-green fill-neon-green" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black text-white tracking-widest uppercase font-mono leading-none">
            Code<span className="text-neon-green">Along</span>
          </span>
          <span className="text-[0.6rem] text-white/40 font-mono tracking-[0.2em] uppercase">
            v2.0.4 stable
          </span>
        </div>
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={clsx(
                "relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 z-10 overflow-hidden group",
                isActive ? "text-black font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-neon-green shadow-[0_0_20px_rgba(57,255,20,0.6)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="relative overflow-hidden group px-6 py-2 bg-neon-green/10 border border-neon-green/30 rounded-lg text-neon-green font-bold text-sm hover:bg-neon-green hover:text-black transition-all shadow-[0_0_10px_rgba(57,255,20,0.1)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]">
          <span className="relative z-10 flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" />
            RUN CODE
          </span>
        </button>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2" />

        <button 
          onClick={onProfileClick}
          className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden hover:border-neon-green transition-colors group"
        >
          <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
            alt="User Profile" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-neon-green border-2 border-black rounded-full translate-x-1/4 translate-y-1/4" />
        </button>
      </div>
    </nav>
  );
});