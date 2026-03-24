import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type CallParticipant = {
  id: string;
  name: string;
  accent: "green" | "pink" | "cyan";
  avatarUrl: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  status: "connecting" | "live" | "idle";
};

type SessionCallContextValue = {
  isJoinModalOpen: boolean;
  activeRoomId: string | null;
  displayName: string;
  participants: CallParticipant[];
  isConnected: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  openJoinModal: () => void;
  closeJoinModal: () => void;
  createRoom: (name?: string) => void;
  joinRoom: (roomId: string, name?: string) => void;
  leaveRoom: () => void;
  setDisplayName: (name: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
};

const localAvatar =
  "https://images.unsplash.com/photo-1612180767923-91c5b42d84dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWJlcnB1bmslMjBoYWNrZXIlMjBhdmF0YXIlMjBuZW9ufGVufDF8fHx8MTc3MTY4MjM1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const remoteAvatar =
  "https://images.unsplash.com/photo-1530739130845-c4121d38e013?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb2FsYSUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTY4MjM1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const secondRemoteAvatar =
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80";

const SessionCallContext = createContext<SessionCallContextValue | null>(null);

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `CA-${suffix}`;
}

function normalizeRoomCode(roomId: string) {
  return roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function buildParticipants(name: string): CallParticipant[] {
  return [
    {
      id: "local-user",
      name,
      accent: "green",
      avatarUrl: localAvatar,
      isLocal: true,
      status: "live",
      isMuted: false,
      isCameraOff: false,
    },
    {
      id: "koala",
      name: "koala",
      accent: "pink",
      avatarUrl: remoteAvatar,
      status: "live",
      isMuted: false,
      isCameraOff: false,
    },
    {
      id: "maya",
      name: "maya",
      accent: "cyan",
      avatarUrl: secondRemoteAvatar,
      status: "idle",
      isMuted: true,
      isCameraOff: true,
    },
  ];
}

export function SessionCallProvider({ children }: { children: React.ReactNode }) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState("You");
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const setDisplayName = useCallback((name: string) => {
    const normalizedName = name.trim() || "You";
    setDisplayNameState(normalizedName);
    setParticipants((current) =>
      current.map((participant) =>
        participant.isLocal ? { ...participant, name: normalizedName } : participant,
      ),
    );
  }, []);

  const connectToRoom = useCallback((roomId: string, name?: string) => {
    const normalizedName = name?.trim() || displayName || "You";
    const normalizedRoomId = normalizeRoomCode(roomId) || generateRoomCode();

    setDisplayNameState(normalizedName);
    setActiveRoomId(normalizedRoomId);
    setParticipants(buildParticipants(normalizedName));
    setMicEnabled(true);
    setCameraEnabled(true);
    setIsJoinModalOpen(false);
  }, [displayName]);

  const createRoom = useCallback((name?: string) => {
    connectToRoom(generateRoomCode(), name);
  }, [connectToRoom]);

  const joinRoom = useCallback((roomId: string, name?: string) => {
    connectToRoom(roomId, name);
  }, [connectToRoom]);

  const leaveRoom = useCallback(() => {
    setActiveRoomId(null);
    setParticipants([]);
    setIsJoinModalOpen(false);
  }, []);

  const toggleMic = useCallback(() => {
    setMicEnabled((current) => {
      const next = !current;
      setParticipants((participantsList) =>
        participantsList.map((participant) =>
          participant.isLocal ? { ...participant, isMuted: !next } : participant,
        ),
      );
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((current) => {
      const next = !current;
      setParticipants((participantsList) =>
        participantsList.map((participant) =>
          participant.isLocal ? { ...participant, isCameraOff: !next } : participant,
        ),
      );
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isJoinModalOpen,
      activeRoomId,
      displayName,
      participants,
      isConnected: Boolean(activeRoomId),
      micEnabled,
      cameraEnabled,
      openJoinModal: () => setIsJoinModalOpen(true),
      closeJoinModal: () => setIsJoinModalOpen(false),
      createRoom,
      joinRoom,
      leaveRoom,
      setDisplayName,
      toggleMic,
      toggleCamera,
    }),
    [
      activeRoomId,
      cameraEnabled,
      createRoom,
      displayName,
      isJoinModalOpen,
      joinRoom,
      leaveRoom,
      micEnabled,
      participants,
      setDisplayName,
      toggleCamera,
      toggleMic,
    ],
  );

  return <SessionCallContext.Provider value={value}>{children}</SessionCallContext.Provider>;
}

export function useSessionCall() {
  const context = useContext(SessionCallContext);

  if (!context) {
    throw new Error("useSessionCall must be used within a SessionCallProvider.");
  }

  return context;
}
