const MAX_REQUEST_BODY_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES || 256 * 1024);

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;

    if (totalBytes > MAX_REQUEST_BODY_BYTES) {
      throw new Error("Request body too large.");
    }

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

  const pistonBaseUrl = process.env.PISTON_BASE_URL?.replace(/\/$/, "");
  const pistonApiKey = process.env.PISTON_API_KEY?.trim();

  if (!pistonBaseUrl) {
    res.status(500).json({
      message: "PISTON_BASE_URL is not configured in Vercel environment variables.",
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (pistonApiKey) {
      headers.Authorization = `Bearer ${pistonApiKey}`;
    }

    const upstream = await fetch(`${pistonBaseUrl}/api/v2/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8")
      .send(text);
  } catch (error) {
    res.status(502).json({
      message: "Failed to reach the configured Piston service.",
      details: error instanceof Error ? error.message : "Unknown proxy error.",
    });
  }
}
