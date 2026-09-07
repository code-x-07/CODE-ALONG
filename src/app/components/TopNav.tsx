import { Link, useLocation } from "react-router-dom";
import { Zap, Play, Code2, Swords, PenTool, Radio, PanelLeft } from "lucide-react";
import clsx from "clsx";
import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSessionCall } from "../context/SessionCallContext";

interface TopNavProps {
  onProfileClick: () => void;
  onToggleSidebar: () => void;
}

export const TopNav = React.memo(function TopNav({ onProfileClick, onToggleSidebar }: TopNavProps) {
  const location = useLocation();
  const currentPath = location.pathname.split("/")[1] || "collaborate";
  const { executionStatus, runMode } = useWorkspace();
  const { activeRoomId, pendingRoomId, isConnected, openJoinModal, displayName } = useSessionCall();
  const canRun = currentPath === "collaborate" || currentPath === "arena";
  const isRunning = executionStatus === "running";

  const tabs = [
    { id: "collaborate", label: "Collaborate", path: "/collaborate", icon: <Code2 className="w-4 h-4" /> },
    { id: "arena", label: "Arena", path: "/arena", icon: <Swords className="w-4 h-4" /> },
    { id: "whiteboard", label: "Whiteboard", path: "/whiteboard", icon: <PenTool className="w-4 h-4" /> },
  ];

  return (
    <nav className="relative z-50 flex h-chrome w-full items-center justify-between border-b border-line bg-surface px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="rounded-control p-1.5 text-ink-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
          title="Toggle explorer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-control bg-accent">
          <Zap className="h-4 w-4 text-ground" fill="currentColor" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          Code Along
        </span>
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={clsx(
                "flex items-center gap-2 rounded-control px-3 py-1.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-accent-subtle text-accent ring-1 ring-inset ring-accent/25"
                  : "text-ink-muted hover:bg-raised hover:text-ink",
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openJoinModal()}
          className={clsx(
            "flex items-center gap-2 rounded-control border px-3 py-1.5 text-[13px] font-medium transition-colors",
            isConnected || pendingRoomId
              ? "border-accent/40 bg-accent-subtle text-accent"
              : "border-line-strong text-ink-muted hover:border-accent/40 hover:text-ink",
          )}
        >
          {isConnected ? (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          ) : (
            <Radio className="h-3.5 w-3.5" />
          )}
          <span className={clsx(activeRoomId && "font-mono")}>
            {activeRoomId || pendingRoomId || "Join room"}
          </span>
        </button>

        <button
          onClick={() => void runMode(currentPath as "collaborate" | "arena" | "whiteboard")}
          disabled={!canRun || isRunning}
          className={clsx(
            "flex items-center gap-2 rounded-control px-3 py-1.5 text-[13px] font-medium transition-colors",
            canRun && !isRunning
              ? "bg-accent text-ground hover:bg-accent-hover"
              : "cursor-not-allowed bg-raised text-ink-faint",
          )}
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          {isRunning ? "Running…" : "Run"}
        </button>

        <button
          onClick={onProfileClick}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-raised font-mono text-[11px] font-semibold text-ink-muted ring-1 ring-line-strong transition-colors hover:text-ink hover:ring-accent/40"
        >
          {displayName.slice(0, 2).toUpperCase()}
        </button>
      </div>
    </nav>
  );
});
