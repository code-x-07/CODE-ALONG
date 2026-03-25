import { createReadStream, existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AccessToken } from "livekit-server-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PISTON_BASE_URL = (process.env.PISTON_BASE_URL || "http://localhost:2000").replace(/\/$/, "");
const PISTON_API_KEY = process.env.PISTON_API_KEY?.trim();
const LIVEKIT_URL = process.env.LIVEKIT_URL?.trim();
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY?.trim();
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET?.trim();
const EXECUTION_RATE_LIMIT_WINDOW_MS = Number(process.env.EXECUTION_RATE_LIMIT_WINDOW_MS || 60_000);
const EXECUTION_RATE_LIMIT_MAX_REQUESTS = Number(process.env.EXECUTION_RATE_LIMIT_MAX_REQUESTS || 30);
const MAX_REQUEST_BODY_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES || 256 * 1024);
const DIST_DIR = path.join(__dirname, "dist");
const executionRequestLog = new Map();

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }

      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function getClientAddress(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "unknown";
}

function isExecutionRateLimited(req) {
  const clientAddress = getClientAddress(req);
  const now = Date.now();
  const currentWindow = executionRequestLog.get(clientAddress) || [];
  const recentRequests = currentWindow.filter((timestamp) => now - timestamp < EXECUTION_RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= EXECUTION_RATE_LIMIT_MAX_REQUESTS) {
    executionRequestLog.set(clientAddress, recentRequests);
    return true;
  }

  recentRequests.push(now);
  executionRequestLog.set(clientAddress, recentRequests);
  return false;
}

async function proxyToPiston(req, res, endpointPath) {
  try {
    const headers = {
      Accept: "application/json",
    };

    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    if (PISTON_API_KEY) {
      headers.Authorization = `Bearer ${PISTON_API_KEY}`;
    }

    const body = req.method === "POST" ? await readRequestBody(req) : undefined;
    const upstream = await fetch(`${PISTON_BASE_URL}${endpointPath}`, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    res.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
    });
    res.end(text);
  } catch (error) {
    sendJson(res, 502, {
      message: "Failed to reach the configured Piston service.",
      details: error instanceof Error ? error.message : "Unknown proxy error.",
    });
  }
}

async function createLiveKitToken(req, res) {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    sendJson(res, 500, {
      message: "LiveKit environment variables are missing. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
    });
    return;
  }

  try {
    const rawBody = await readRequestBody(req);
    const { roomName, participantName } = rawBody ? JSON.parse(rawBody) : {};
    const normalizedRoomName = String(roomName || "").trim().toUpperCase();
    const normalizedParticipantName = String(participantName || "").trim() || "Guest";

    if (!normalizedRoomName) {
      sendJson(res, 400, { message: "roomName is required." });
      return;
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
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

    sendJson(res, 200, {
      token: await token.toJwt(),
      url: LIVEKIT_URL,
      roomName: normalizedRoomName,
      participantName: normalizedParticipantName,
    });
  } catch (error) {
    sendJson(res, 500, {
      message: "Failed to create a LiveKit token.",
      details: error instanceof Error ? error.message : "Unknown token error.",
    });
  }
}

async function serveStatic(res, requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(DIST_DIR, safePath);
  const fallbackPath = path.join(DIST_DIR, "index.html");
  const targetPath = existsSync(filePath) ? filePath : fallbackPath;

  try {
    const stats = await fs.stat(targetPath);

    if (!stats.isFile()) {
      throw new Error("Not a file");
    }

    const ext = path.extname(targetPath);
    res.writeHead(200, {
      "Content-Type": contentTypes.get(ext) || "application/octet-stream",
    });
    createReadStream(targetPath).pipe(res);
  } catch {
    sendJson(res, 404, { message: "Build output not found. Run npm run build first." });
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { message: "Invalid request." });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/piston/execute" && req.method === "POST") {
    if (isExecutionRateLimited(req)) {
      sendJson(res, 429, {
        message: "Execution rate limit reached. Please wait and try again.",
      });
      return;
    }

    await proxyToPiston(req, res, "/api/v2/execute");
    return;
  }

  if (url.pathname === "/api/piston/runtimes" && req.method === "GET") {
    await proxyToPiston(req, res, "/api/v2/runtimes");
    return;
  }

  if (url.pathname === "/api/livekit/token" && req.method === "POST") {
    await createLiveKitToken(req, res);
    return;
  }

  if ((url.pathname === "/health" || url.pathname === "/api/health") && req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      pistonBaseUrl: PISTON_BASE_URL,
      livekitConfigured: Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
      rateLimitWindowMs: EXECUTION_RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: EXECUTION_RATE_LIMIT_MAX_REQUESTS,
    });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  await serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Code Along server listening on http://localhost:${PORT}`);
  console.log(`Piston upstream: ${PISTON_BASE_URL}`);
  console.log(
    `Execution rate limit: ${EXECUTION_RATE_LIMIT_MAX_REQUESTS} requests / ${EXECUTION_RATE_LIMIT_WINDOW_MS}ms`,
  );
});
