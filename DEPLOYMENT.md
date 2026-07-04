# Code Along Deployment

Two supported paths: **Vercel** (recommended, easiest) or **Docker / any Node host**.

## Option A — Vercel (recommended)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new). Vercel auto-detects Vite; the `api/` folder becomes serverless functions.
2. In **Project Settings → Environment Variables**, add:
   - `LIVEKIT_URL` — `wss://<project>.livekit.cloud`
   - `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
   - `PISTON_BASE_URL` *(optional — only for non-JavaScript execution)*
3. Deploy. Done — rooms, video, multiplayer sync, and JS execution all work.

### Getting LiveKit keys (free)

1. Sign up at [cloud.livekit.io](https://cloud.livekit.io) (generous free tier).
2. Create a project → copy the **WebSocket URL** (`wss://…livekit.cloud`).
3. Settings → Keys → create an API key/secret pair.

## Option B — Docker / Node server

```bash
npm run build
docker build -t code-along-app .
docker run -p 3000:3000 \
  -e LIVEKIT_URL=wss://your-project.livekit.cloud \
  -e LIVEKIT_API_KEY=... \
  -e LIVEKIT_API_SECRET=... \
  -e PISTON_BASE_URL=https://your-piston-host/api/v2 \
  code-along-app
```

Health check: `curl http://localhost:3000/health`

## Code execution notes

- **JavaScript needs no backend at all** — it runs in an in-browser sandboxed Web Worker (also powers Arena scoring).
- Other languages proxy through `/api/piston/*` to a Piston instance:
  - The public `emkc.org` API is **whitelist-only since Feb 2026**.
  - Self-host instead: `git clone https://github.com/engineer-man/piston && cd piston && docker-compose up -d api`, install runtimes via the Piston CLI, then set `PISTON_BASE_URL=http://your-host:2000/api/v2`.
- Keep the built-in execution rate limiting enabled (`EXECUTION_RATE_LIMIT_*` vars).
- Never expose Piston directly to the browser — always go through the proxy.

## Production checklist

- [ ] LiveKit env vars set (rooms + video + sync)
- [ ] `PISTON_BASE_URL` set if you want Python/Java/C++/… execution
- [ ] Rate limiting left enabled
- [ ] HTTPS termination (Vercel handles this automatically)
