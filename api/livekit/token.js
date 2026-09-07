import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

// Lightweight in-memory rate limit by client IP, mirroring the Piston execution
// limiter in server.mjs. NOTE: in-memory state is per-instance, so on serverless
// this is only partial protection — a Vercel WAF rule is the real fix.
const TOKEN_RATE_LIMIT_WINDOW_MS = Number(process.env.TOKEN_RATE_LIMIT_WINDOW_MS || 60_000);
const TOKEN_RATE_LIMIT_MAX_REQUESTS = Number(process.env.TOKEN_RATE_LIMIT_MAX_REQUESTS || 20);
const tokenRequestLog = new Map();

function getClientAddress(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isTokenRateLimited(req) {
  const clientAddress = getClientAddress(req);
  const now = Date.now();
  const currentWindow = tokenRequestLog.get(clientAddress) || [];
  const recentRequests = currentWindow.filter((timestamp) => now - timestamp < TOKEN_RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= TOKEN_RATE_LIMIT_MAX_REQUESTS) {
    tokenRequestLog.set(clientAddress, recentRequests);
    return true;
  }

  recentRequests.push(now);
  tokenRequestLog.set(clientAddress, recentRequests);
  return false;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  if (isTokenRateLimited(req)) {
    res.status(429).json({
      message: "Too many token requests from this address. Wait a minute and try again.",
    });
    return;
  }

  const livekitUrl = process.env.LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

  if (!livekitUrl || !apiKey || !apiSecret) {
    res.status(500).json({
      message: "LiveKit environment variables are missing. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
    });
    return;
  }

  try {
    const { roomName, participantName } = await readBody(req);
    const normalizedRoomName = String(roomName || "").trim().toUpperCase();
    const normalizedParticipantName = String(participantName || "").trim() || "Guest";

    if (!normalizedRoomName) {
      res.status(400).json({ message: "roomName is required." });
      return;
    }

    const serviceUrl = livekitUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const roomService = new RoomServiceClient(serviceUrl, apiKey, apiSecret);
    const maxParticipants = Number(process.env.MAX_ROOM_PARTICIPANTS || 8);

    try {
      const existingParticipants = await roomService.listParticipants(normalizedRoomName);

      if (existingParticipants.length >= maxParticipants) {
        res.status(409).json({
          message: "This room is full. Ask the host for a new room code.",
        });
        return;
      }
    } catch {
      // If the room does not exist yet, LiveKit can throw. That is fine for new room creation.
    }

    // Identity must be unique per connection — LiveKit disconnects the previous
    // session when a second participant connects with the same identity.
    const identity = `${normalizedParticipantName}-${Math.random().toString(36).slice(2, 8)}`;
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: normalizedParticipantName,
      ttl: "10m",
    });

    token.addGrant({
      roomJoin: true,
      room: normalizedRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    res.status(200).json({
      token: await token.toJwt(),
      url: livekitUrl,
      roomName: normalizedRoomName,
      participantName: normalizedParticipantName,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create a LiveKit token.",
      details: error instanceof Error ? error.message : "Unknown token error.",
    });
  }
}
