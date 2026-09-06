# CODE ALONG — Production Readiness & Frontend Redesign

**Date:** 2026-09-07
**Status:** Awaiting review

## Context

CODE ALONG is a real-time collaborative coding workspace — multiplayer editor,
1v1 coding duels, shared whiteboard — built on LiveKit. It builds cleanly and
has 15 successful production deployments on Vercel.

It is nonetheless not a usable product, for three independent reasons:

1. **Nobody but the owner can open it.** Vercel SSO deployment protection is
   enabled, so every `.vercel.app` URL returns 401 behind a login wall. For an
   app whose premise is "share a room code with a friend," this is fatal — the
   multiplayer features have never been exercised by a second person.
2. **The frontend reads as machine-generated.** Neon green on black, glow on
   every surface, empty `fonts.css`, and no consistent spacing or alignment
   system.
3. **The repo is mostly dead code.** All 46 shadcn/ui components are unused,
   along with roughly 35 npm dependencies.

The intended outcome: a genuinely shareable URL, a frontend that reads as a
deliberate professional product, and a repo that contains only what it uses.

## Goals

- A URL that a second person can open and use, with multiplayer verified working
- A frontend that is organised, aligned, and modern — with no glow effects
- Only code and dependencies the app actually uses
- Honest UI states where a capability is genuinely unavailable

## Non-goals

- New features. Collaborate, Arena, and Whiteboard stay as they are.
- Self-hosting Piston. Non-JS execution degrades honestly instead.
- Backend or realtime protocol changes. The LiveKit layer is sound.

---

## 1. Deployment — the blocker

`ssoProtection.enabled = true` with `deploymentType: "all_except_custom_domains"`.

**Fix:** disable SSO protection so `.vercel.app` URLs are public. (A custom
domain would also bypass it, if one is preferred later.)

Verified already present and correct — no action needed:
`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

`PISTON_BASE_URL` is set but points at `emkc.org`, which went whitelist-only in
February 2026. See §5.

**Verification:** load the production URL in a logged-out context, open a room
in two independent sessions, and confirm participants see each other.

---

## 2. Design tokens — the "properly organised" fix

Misalignment is a symptom: there is no scale, so every value was chosen ad hoc.

Current state measured in `src/app/`:

| Axis | Now | Target |
|---|---|---|
| Chrome bar heights | 5 (`h-8/10/12/16/20`) | **1 — 48px** everywhere |
| Border colors | 14 distinct | **2** — `border`, `border-strong` |
| Spacing | ad hoc | **4 / 8 / 12 / 16 / 24 / 32 / 48** |
| Radius | md, lg, xl, full mixed | **2** — 6px controls, 10px panels |

A single 48px chrome height across the top nav, sidebar header, editor tab
strip, and terminal header is the specific change that makes columns line up.

Tokens are defined once in `src/styles/theme.css`, replacing the unused
shadcn light/dark token block currently there.

## 3. Color — dark, modern, no glow

```
ground   #0B0D10     surface  #131720     raised   #1A1F2A
border   #242A35     strong   #333B49
text     #E8EAED     muted    #9BA3B0     faint    #646C7A
accent   #5B8DEF     hover    #7BA4F5     subtle   rgba(91,141,239,0.12)
success  #4ADE80     error    #F87171     warning  #FBBF24
```

`accent` (#5B8DEF, a controlled blue) is used *only* for active navigation state,
focus rings, and the active file in the tree. It never appears as decoration,
never glows, and never carries a gradient.

Semantic colors are reserved for terminal output and arena results — never for
chrome or navigation.

**Removed:** every `shadow-[0_0_Npx_rgba(...)]` glow; the three animated blurred
background blobs in `layout.tsx`; the film-grain overlay; the dot-grid overlay;
`--color-neon-pink`.

Depth comes from surface layering and hairline borders. The accent reads as
meaningful because it is rare.

File-type icons in `Sidebar.tsx` collapse from six unrelated hues
(red/blue/cyan/yellow/blue-500/green) to one muted tone, accent when active.

## 4. Typography

`src/styles/fonts.css` is empty — the app renders in system default sans. This is
the largest single reason it reads as templated.

- **UI:** Inter (variable), self-hosted via `@fontsource-variable/inter`
- **Mono:** JetBrains Mono — editor, terminal, room codes
- **Scale:** 11 / 12 / 13 / 14 / 16 / 20 / 24 with fixed weights

Remove all-caps mono chrome (`RUN CODE` → `Run`, `JOIN ROOM` → `Join room`) and
delete the hardcoded `v2.0.4 stable` string in `TopNav.tsx`.

## 5. Honest states and unfinished work

- **`window.prompt()` for new file / new folder** (`Sidebar.tsx:144-160`) is the
  most visibly unfinished element in the app. Replace with inline inputs in the
  tree, with Enter to confirm and Escape to cancel.
- **Doubled active state:** `TreeNode` renders its highlight twice — a `clsx`
  background *and* an absolutely positioned `motion.div` carrying the same border
  and background (`Sidebar.tsx:56-69`, `106-120`). Keep the `motion.div`.
- **Piston degradation:** JavaScript runs in-browser and is unaffected. For other
  languages, surface an explicit "runtime not configured" state in the language
  picker and terminal rather than a generic failure.
- **Empty and connecting states:** no files open, arena awaiting an opponent,
  blank whiteboard, LiveKit connecting/failed.

## 6. Layout and responsive

- Unified 48px chrome across all columns
- Sidebar resizable with min/max, collapsing below 1024px (currently fixed
  `w-[300px]`)
- Real breakpoints — the app currently has 9 responsive utilities total, so all
  three modes break below desktop width

## 7. Cleanup

- Delete all 46 components in `src/app/components/ui/` — none are imported by
  application code
- Remove unused dependencies: ~30 Radix packages, MUI, Emotion, react-slick,
  react-dnd, recharts, embla, vaul, cmdk, react-day-picker, input-otp, popper,
  masonry
- Delete the unused shadcn token block in `theme.css`

Retained imports: `react`, `react-router-dom`, `livekit-client`,
`livekit-server-sdk`, `motion`, `lucide-react`, `clsx`, `prismjs`,
`react-simple-code-editor`.

Expected: **977 KB → ~400 KB** JS bundle (283 KB → ~130 KB gzipped).

## 8. Shell metadata

`index.html` carries only a title. Add description, favicon, theme-color, and
Open Graph tags so shared links render properly — this matters for an app whose
distribution model is pasting a link to someone.

---

## Sequence

1. **Cleanup** — delete unused components and dependencies; confirm build
2. **Tokens and typography** — `theme.css`, `fonts.css`, `globals.css`
3. **Layout** — 48px chrome, sidebar resize, responsive
4. **Components** — apply tokens; remove glow; fix doubled active state
5. **Completion** — inline file creation, empty/error states, Piston degradation
6. **Deploy** — disable SSO protection, add shell metadata, verify multiplayer

Each step ends with a passing `npm run build`. Steps 1–5 are verifiable locally;
step 6 requires the deployed URL.

## Verification

- `npm run build` passes at every step
- Bundle size measured before and after cleanup
- `npm run dev` — exercise all three modes, create files inline, run JS, confirm
  a non-JS language shows the honest unavailable state
- Grep audits confirm: 0 glow shadows, ≤2 border tokens, 1 chrome height
- Production URL loads logged-out; two independent sessions join one room and
  see each other's edits, video, and whiteboard strokes

## Risks

- **Disabling SSO protection makes the app publicly reachable.** Execution is
  in-browser JS only, and existing rate limiting stays enabled, so exposure is
  limited — but it is a deliberate choice to make it public.
- **Removing 46 components is irreversible in-branch.** They are recoverable from
  git history; the grep audit confirming zero application imports is the
  safeguard.
- **Multiplayer has never been verified with two real participants.** Latent bugs
  may surface once step 6 makes real testing possible for the first time.
