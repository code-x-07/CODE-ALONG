# ⚡ CODE ALONG

A real-time collaborative coding workspace with live video, competitive coding duels, and a shared whiteboard — wrapped in a neon, pro-grade UI.

## The three modes

| Mode | What it does |
| --- | --- |
| **`</>` Collaborate** | Multiplayer code editor. Every keystroke, file create/delete, and tab syncs live to everyone in the room while video bubbles float over the editor. |
| **`⚔️` Arena** | 1v1 coding duel. Synced countdown, shared challenge with hidden tests, live opponent code streaming, scoring by tests passed + time. |
| **`✏️` Whiteboard** | Infinite canvas with pen / eraser / shapes / text, neon glow rendering, pan + zoom — strokes stream to the room in real time. |

Switching tabs never disconnects the room: the WebRTC session (LiveKit) and all realtime state are hoisted above the router.

## How it works

- **Frontend:** React 18 + TypeScript + Vite + Tailwind 4, `react-simple-code-editor` + Prism highlighting, `motion` animations.
- **Realtime:** [LiveKit](https://livekit.io) — WebRTC video/audio + data channels. Code sync, whiteboard ops, and arena state all ride the same data channel (topics: `ws:*`, `wb:*`, `ar:*`).
- **Code execution:**
  - **JavaScript** runs instantly in an **in-browser sandboxed Web Worker** (zero config, no rate limits — this also powers Arena scoring).
  - **Python, Java, C++, Go, Rust, …** run through a [Piston](https://github.com/engineer-man/piston) proxy. Note: the public `emkc.org` instance is whitelist-only since Feb 2026, so point `PISTON_BASE_URL` at a self-hosted or authorized instance.

## Quick start

```bash
npm install
cp .env.example .env   # add your LiveKit keys (free at cloud.livekit.io)
npm run dev            # http://localhost:5173
```

Without LiveKit keys the app still works solo (editor, JS execution, local whiteboard). Rooms, video, and multiplayer sync need the keys.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `LIVEKIT_URL` | for multiplayer | `wss://<project>.livekit.cloud` |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | for multiplayer | From LiveKit Cloud → Settings → Keys |
| `PISTON_BASE_URL` | for non-JS execution | Piston API root, e.g. `http://your-host:2000/api/v2` |
| `PISTON_API_KEY` | optional | Sent as `Authorization: Bearer` to Piston |

## Production

```bash
npm run build   # outputs dist/
npm start       # node server.mjs — serves dist/ + API routes on :3000
```

Or deploy to **Vercel**: the `api/` directory provides the serverless routes (`/api/livekit/token`, `/api/piston/*`). Add the env vars in Project Settings → Environment Variables. See [DEPLOYMENT.md](DEPLOYMENT.md).

---

Originally scaffolded from a Figma Make design ([source](https://www.figma.com/design/j8rtlU7tQfDctevXOXBQn1/Collaborative-Code-Editor-UI)).
