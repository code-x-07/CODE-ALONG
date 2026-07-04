export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed." });
    return;
  }

  // Piston API root. Public instance: https://emkc.org/api/v2/piston
  const pistonBaseUrl = (process.env.PISTON_BASE_URL || "https://emkc.org/api/v2/piston").replace(/\/$/, "");
  const pistonApiKey = process.env.PISTON_API_KEY?.trim();

  try {
    const headers = {
      Accept: "application/json",
    };

    if (pistonApiKey) {
      headers.Authorization = `Bearer ${pistonApiKey}`;
    }

    const upstream = await fetch(`${pistonBaseUrl}/runtimes`, {
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
