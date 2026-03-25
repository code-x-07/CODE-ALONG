import { AccessToken } from "livekit-server-sdk";

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

    const token = new AccessToken(apiKey, apiSecret, {
      identity: normalizedParticipantName,
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
