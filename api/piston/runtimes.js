export default async function handler(req, res) {
  if (req.method !== "GET") {
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
    const headers = {
      Accept: "application/json",
    };

    if (pistonApiKey) {
      headers.Authorization = `Bearer ${pistonApiKey}`;
    }

    const upstream = await fetch(`${pistonBaseUrl}/api/v2/runtimes`, {
      method: "GET",
      headers,
    });

    const text = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8")
      .send(text);
  } catch (error) {
    res.status(502).json({
      message: "Failed to load installed Piston runtimes.",
      details: error instanceof Error ? error.message : "Unknown proxy error.",
    });
  }
}
