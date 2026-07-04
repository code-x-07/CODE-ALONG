import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ConnectionState, Participant, Room, RoomEvent, Track } from "livekit-client";

export type CallParticipant = {
  id: string;
  name: string;
  accent: "green" | "pink" | "cyan";
  avatarUrl?: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  status: "connecting" | "live" | "idle";
  participant?: Participant;
};

export type DataMessageHandler = (payload: unknown, senderIdentity: string) => void;

/** Topic used to notify subscribers that a new participant joined the room. */
export const TOPIC_PARTICIPANT_JOINED = "system:participant-joined";

type SessionCallContextValue = {
  isJoinModalOpen: boolean;
  activeRoomId: string | null;
  pendingRoomId: string | null;
  displayName: string;
  participants: CallParticipant[];
  isConnected: boolean;
  isConnecting: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  liveKitUrl: string | null;
  shareUrl: string | null;
  copiedShareLink: boolean;
  errorMessage: string | null;
  openJoinModal: (roomId?: string) => void;
  closeJoinModal: () => void;
  createRoom: (name?: string) => Promise<void>;
  joinRoom: (roomId: string, name?: string) => Promise<void>;
  leaveRoom: () => void;
  stageRoom: (roomId: string | null) => void;
  copyShareLink: () => Promise<void>;
  setDisplayName: (name: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  /** Publish a JSON payload to every peer in the room on a topic. Returns false when not connected. */
  sendData: (topic: string, payload: unknown, reliable?: boolean) => boolean;
  /** Subscribe to JSON payloads published by peers on a topic. Returns an unsubscribe function. */
  subscribeData: (topic: string, handler: DataMessageHandler) => () => void;
  /** Identity of the local participant inside the active room, or null when not connected. */
  localIdentity: string | null;
};

const SessionCallContext = createContext<SessionCallContextValue | null>(null);

const accentCycle: Array<CallParticipant["accent"]> = ["green", "pink", "cyan"];

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

function buildArenaRoomLink(roomId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return `${window.location.origin}/arena/${encodeURIComponent(roomId)}`;
}

function syncRoomLocation(roomId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);

  if (currentUrl.pathname.startsWith("/arena")) {
    currentUrl.pathname = roomId ? `/arena/${encodeURIComponent(roomId)}` : "/arena";
    currentUrl.searchParams.delete("room");
  } else if (roomId) {
    currentUrl.searchParams.set("room", roomId);
  } else {
    currentUrl.searchParams.delete("room");
  }

  window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
}

function getParticipantName(participant: Participant, fallbackName: string) {
  return participant.name || participant.identity || fallbackName;
}

function buildParticipants(room: Room, fallbackLocalName: string): CallParticipant[] {
  const liveParticipants = [room.localParticipant, ...Array.from(room.remoteParticipants.values())];

  return liveParticipants.map((participant, index) => {
    const publications = Array.from(participant.trackPublications.values());
    const hasCameraTrack = publications.some(
      (publication) => publication.kind === Track.Kind.Video && publication.track && !publication.isMuted,
    );
    const hasMicTrack = publications.some(
      (publication) => publication.kind === Track.Kind.Audio && publication.track && !publication.isMuted,
    );
    const isLocal = participant.isLocal;

    return {
      id: participant.identity,
      name: getParticipantName(participant, fallbackLocalName),
      accent: accentCycle[index % accentCycle.length],
      isLocal,
      isMuted: !hasMicTrack,
      isCameraOff: !hasCameraTrack,
      status: room.state === ConnectionState.Connected ? "live" : "connecting",
      participant,
    };
  });
}

async function requestLiveKitToken(roomName: string, participantName: string) {
  const response = await fetch("/api/livekit/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ roomName, participantName }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create a LiveKit token.");
  }

  return data as { token: string; url: string; roomName: string; participantName: string };
}

export function SessionCallProvider({ children }: { children: React.ReactNode }) {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState("You");
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localIdentity, setLocalIdentity] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const dataHandlersRef = useRef<Map<string, Set<DataMessageHandler>>>(new Map());

  const dispatchData = useCallback((topic: string, payload: unknown, senderIdentity: string) => {
    dataHandlersRef.current.get(topic)?.forEach((handler) => {
      try {
        handler(payload, senderIdentity);
      } catch {
        // A misbehaving subscriber should never break the transport.
      }
    });
  }, []);

  const subscribeData = useCallback((topic: string, handler: DataMessageHandler) => {
    const handlers = dataHandlersRef.current;

    if (!handlers.has(topic)) {
      handlers.set(topic, new Set());
    }

    handlers.get(topic)!.add(handler);

    return () => {
      handlers.get(topic)?.delete(handler);
    };
  }, []);

  const sendData = useCallback((topic: string, payload: unknown, reliable = true) => {
    const room = roomRef.current;

    if (!room || room.state !== ConnectionState.Connected) {
      return false;
    }

    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    void room.localParticipant.publishData(bytes, { reliable, topic });
    return true;
  }, []);

  const syncParticipants = useCallback((room: Room, fallbackLocalName: string) => {
    setParticipants(buildParticipants(room, fallbackLocalName));
  }, []);

  const cleanupRoom = useCallback(() => {
    roomRef.current?.removeAllListeners();
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsConnected(false);
  }, []);

  const setDisplayName = useCallback((name: string) => {
    const normalizedName = name.trim() || "You";
    setDisplayNameState(normalizedName);
    setParticipants((current) =>
      current.map((participant) =>
        participant.isLocal ? { ...participant, name: normalizedName } : participant,
      ),
    );
  }, []);

  const stageRoom = useCallback((roomId: string | null) => {
    const normalized = roomId ? normalizeRoomCode(roomId) : null;
    setPendingRoomId(normalized);
  }, []);

  const connectToRoom = useCallback(
    async (roomId: string, name?: string) => {
      const normalizedName = name?.trim() || displayName || "You";
      const normalizedRoomId = normalizeRoomCode(roomId) || generateRoomCode();

      setErrorMessage(null);
      setIsJoinModalOpen(false);
      setIsConnecting(true);
      setIsConnected(false);
      setCopiedShareLink(false);
      setDisplayNameState(normalizedName);
      setActiveRoomId(normalizedRoomId);
      setPendingRoomId(normalizedRoomId);

      cleanupRoom();

      try {
        const { token, url } = await requestLiveKitToken(normalizedRoomId, normalizedName);
        const nextRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        const handleRoomUpdate = () => {
          setIsConnected(nextRoom.state === ConnectionState.Connected);
          syncParticipants(nextRoom, normalizedName);
        };

        nextRoom
          .on(RoomEvent.Connected, handleRoomUpdate)
          .on(RoomEvent.ConnectionStateChanged, handleRoomUpdate)
          .on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
            if (!topic) {
              return;
            }

            try {
              const decoded = JSON.parse(new TextDecoder().decode(payload));
              dispatchData(topic, decoded, participant?.identity || "unknown");
            } catch {
              // Ignore malformed peer payloads.
            }
          })
          .on(RoomEvent.ParticipantConnected, (participant) => {
            handleRoomUpdate();
            dispatchData(TOPIC_PARTICIPANT_JOINED, { identity: participant.identity }, participant.identity);
          })
          .on(RoomEvent.ParticipantDisconnected, handleRoomUpdate)
          .on(RoomEvent.LocalTrackPublished, handleRoomUpdate)
          .on(RoomEvent.LocalTrackUnpublished, handleRoomUpdate)
          .on(RoomEvent.TrackMuted, handleRoomUpdate)
          .on(RoomEvent.TrackUnmuted, handleRoomUpdate)
          .on(RoomEvent.TrackSubscribed, handleRoomUpdate)
          .on(RoomEvent.TrackUnsubscribed, handleRoomUpdate)
          .on(RoomEvent.TrackPublished, handleRoomUpdate)
          .on(RoomEvent.TrackUnpublished, handleRoomUpdate)
          .on(RoomEvent.Disconnected, () => {
            setIsConnected(false);
            setParticipants([]);
            setMicEnabled(false);
            setCameraEnabled(false);
            setLocalIdentity(null);
          });

        await nextRoom.connect(url, token);
        roomRef.current = nextRoom;
        setLiveKitUrl(url);
        setLocalIdentity(nextRoom.localParticipant.identity);
        syncRoomLocation(normalizedRoomId);

        try {
          await nextRoom.localParticipant.setMicrophoneEnabled(true);
          setMicEnabled(true);
        } catch {
          setMicEnabled(false);
        }

        try {
          await nextRoom.localParticipant.setCameraEnabled(true);
          setCameraEnabled(true);
        } catch {
          setCameraEnabled(false);
        }

        try {
          await nextRoom.startAudio();
        } catch {
          // Browser autoplay policy can block immediate audio start.
        }

        syncParticipants(nextRoom, normalizedName);
      } catch (error) {
        cleanupRoom();
        setIsConnected(false);
        setParticipants([]);
        setActiveRoomId(null);
        setLiveKitUrl(null);
        setLocalIdentity(null);
        setErrorMessage(error instanceof Error ? error.message : "Failed to connect to the call room.");
      } finally {
        setIsConnecting(false);
      }
    },
    [cleanupRoom, displayName, syncParticipants],
  );

  const createRoom = useCallback((name?: string) => connectToRoom(generateRoomCode(), name), [connectToRoom]);

  const joinRoom = useCallback((roomId: string, name?: string) => connectToRoom(roomId, name), [connectToRoom]);

  const leaveRoom = useCallback(() => {
    cleanupRoom();
    setLocalIdentity(null);
    setActiveRoomId(null);
    setPendingRoomId(null);
    setParticipants([]);
    setMicEnabled(false);
    setCameraEnabled(false);
    setIsJoinModalOpen(false);
    setLiveKitUrl(null);
    setCopiedShareLink(false);
    setErrorMessage(null);
    syncRoomLocation(null);
  }, [cleanupRoom]);

  const copyShareLink = useCallback(async () => {
    const roomId = activeRoomId || pendingRoomId;
    const nextShareUrl = roomId ? buildArenaRoomLink(roomId) : null;

    if (!nextShareUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(nextShareUrl);
    setCopiedShareLink(true);
    window.setTimeout(() => setCopiedShareLink(false), 1800);
  }, [activeRoomId, pendingRoomId]);

  const toggleMic = useCallback(() => {
    void (async () => {
      const room = roomRef.current;

      if (!room) {
        return;
      }

      const next = !micEnabled;
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
      syncParticipants(room, displayName);
    })();
  }, [displayName, micEnabled, syncParticipants]);

  const toggleCamera = useCallback(() => {
    void (async () => {
      const room = roomRef.current;

      if (!room) {
        return;
      }

      const next = !cameraEnabled;
      await room.localParticipant.setCameraEnabled(next);
      setCameraEnabled(next);
      syncParticipants(room, displayName);
    })();
  }, [cameraEnabled, displayName, syncParticipants]);

  useEffect(() => () => cleanupRoom(), [cleanupRoom]);

  const shareUrl = useMemo(() => {
    const roomId = activeRoomId || pendingRoomId;
    return roomId ? buildArenaRoomLink(roomId) : null;
  }, [activeRoomId, pendingRoomId]);

  const value = useMemo(
    () => ({
      isJoinModalOpen,
      activeRoomId,
      pendingRoomId,
      displayName,
      participants,
      isConnected,
      isConnecting,
      micEnabled,
      cameraEnabled,
      liveKitUrl,
      shareUrl,
      copiedShareLink,
      errorMessage,
      openJoinModal: (roomId?: string) => {
        if (roomId) {
          setPendingRoomId(normalizeRoomCode(roomId));
        }
        setIsJoinModalOpen(true);
      },
      closeJoinModal: () => setIsJoinModalOpen(false),
      createRoom,
      joinRoom,
      leaveRoom,
      stageRoom,
      copyShareLink,
      setDisplayName,
      toggleMic,
      toggleCamera,
      sendData,
      subscribeData,
      localIdentity,
    }),
    [
      activeRoomId,
      cameraEnabled,
      copiedShareLink,
      copyShareLink,
      createRoom,
      displayName,
      errorMessage,
      isConnected,
      isConnecting,
      isJoinModalOpen,
      joinRoom,
      leaveRoom,
      liveKitUrl,
      micEnabled,
      pendingRoomId,
      participants,
      shareUrl,
      stageRoom,
      setDisplayName,
      toggleCamera,
      toggleMic,
      sendData,
      subscribeData,
      localIdentity,
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
