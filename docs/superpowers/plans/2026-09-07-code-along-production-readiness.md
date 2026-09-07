# CODE ALONG Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CODE ALONG a shareable, professional-looking product — publicly reachable, visually organised with no glow, and free of dead code.

**Architecture:** Establish an executable verification harness first (TypeScript typecheck + a design audit script that fails on the current code), then refactor until it passes. Design tokens are defined once in Tailwind v4's `@theme` block and consumed everywhere; no component defines its own colors.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 4, TypeScript 5 (added by this plan), LiveKit, Framer Motion (`motion`), Prism.

**Spec:** `docs/superpowers/specs/2026-09-07-code-along-production-readiness-design.md`

## Global Constraints

- **No test framework exists and this plan does not add one.** The red/green cycle is driven by `npm run audit` (a design-rule script) and `npm run typecheck`. These are the tests.
- **Zero glow.** No `shadow-[0_0_...]` anywhere in `src/app/`.
- **Zero `backdrop-blur`** in `src/app/`. Depth comes from surface layering and hairline borders.
- **No raw color utilities in `src/app/`.** No `white/N`, `black/N`, `neon-*`, `cyan-*`, `purple-*`, `blue-N00`, `red-N00`, `yellow-N00`. Only the `@theme` tokens defined in Task 4.
- **One chrome height:** every chrome bar is `h-chrome` (48px). `h-16`, `h-10`, `h-20` are banned in chrome files.
- **Accent `#5B8DEF` is state only** — active nav, focus ring, active file. Never decoration, never gradient.
- **Every task ends with `npm run build` passing.**
- Commit after every task. Branch is `production-readiness`.

---

### Task 1: Verification harness

Nothing in this repo can currently fail. This task creates the two gates every later task depends on.

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `scripts/audit-design.mjs`
- Modify: `package.json` (scripts + devDependencies)

**Interfaces:**
- Consumes: nothing
- Produces: `npm run typecheck` (exits non-zero on type errors), `npm run audit` (exits non-zero on banned visual patterns). Every later task runs both.

- [ ] **Step 1: Install TypeScript**

```bash
npm install -D typescript@5.7.3 @types/react@18.3.5 @types/react-dom@18.3.0 @types/node@22
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "exclude": ["src/app/components/ui", "src/app/components/figma"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

The `exclude` is deliberate and temporary. All 46 files in `components/ui/` are
a machine-generated dump that Task 2 deletes; typechecking them under `strict`
would generate many errors in files about to disappear. **Task 2 removes this
`exclude` key** when it deletes those directories, so coverage becomes complete
exactly when it can be.

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `scripts/audit-design.mjs`**

This is the executable form of the spec's design rules. It scans only
application source — `src/app/**` excluding `components/ui/` — so it stays
meaningful after Task 2 deletes that directory.

```js
#!/usr/bin/env node
// Fails the build when banned visual patterns appear in application source.
// Each rule maps to a requirement in the production-readiness spec.
import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';

const CHROME_FILES = [
  'src/app/layout.tsx',
  'src/app/components/TopNav.tsx',
  'src/app/components/Sidebar.tsx',
  'src/app/pages/Collaborate.tsx',
];

const RULES = [
  {
    name: 'no-glow',
    pattern: /shadow-\[0_0_/g,
    message: 'Glow shadow. Use surface layering and hairline borders instead.',
  },
  {
    name: 'no-backdrop-blur',
    pattern: /backdrop-blur/g,
    message: 'backdrop-blur is part of the removed glass look.',
  },
  {
    name: 'no-neon',
    pattern: /neon-(green|pink)/g,
    message: 'neon-* tokens are removed. Use accent / ink / line tokens.',
  },
  {
    name: 'no-raw-opacity-colors',
    pattern: /\b(?:bg|text|border|from|via|to)-(?:white|black)\/\d+/g,
    message: 'Raw white/black opacity. Use the @theme tokens.',
  },
  {
    name: 'no-adhoc-palette',
    pattern: /\b(?:bg|text|border)-(?:cyan|purple|indigo|emerald|rose|amber|sky|violet)-\d{2,3}/g,
    message: 'Ad-hoc palette color. Use accent / ok / bad / warn tokens.',
  },
  {
    name: 'no-window-prompt',
    pattern: /window\.prompt\(/g,
    message: 'window.prompt() is not a finished UI. Use an inline input.',
  },
];

const CHROME_RULE = {
  name: 'single-chrome-height',
  pattern: /\bh-(?:10|16|20)\b/g,
  message: 'Chrome bars must use h-chrome (48px).',
};

async function collect() {
  const files = [];
  for await (const f of glob('src/app/**/*.{ts,tsx}')) {
    if (!f.includes('components/ui/')) files.push(f);
  }
  return files.sort();
}

const violations = [];

for (const file of await collect()) {
  const source = readFileSync(file, 'utf8');
  const rules = CHROME_FILES.includes(file) ? [...RULES, CHROME_RULE] : RULES;

  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push(`${file}:${line}  [${rule.name}] ${match[0]} — ${rule.message}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`\n✗ ${violations.length} design violation(s):\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('');
  process.exit(1);
}

console.log('✓ design audit clean');
```

- [ ] **Step 5: Add scripts to `package.json`**

Add to the `scripts` block:

```json
"typecheck": "tsc --noEmit",
"audit": "node scripts/audit-design.mjs",
"verify": "npm run typecheck && npm run audit && npm run build"
```

- [ ] **Step 6: Run the audit to confirm it FAILS (this is the red state)**

Run: `npm run audit`
Expected: **exit 1**, listing dozens of violations — glow shadows in `TopNav.tsx`, `neon-green` throughout, `window.prompt(` in `Sidebar.tsx`, `h-16` in `TopNav.tsx`. This failing output is the work list for Tasks 5–9.

- [ ] **Step 7: Run typecheck and record the baseline**

Run: `npm run typecheck`
Expected: may report errors (the code has never been typechecked). Record the count. If errors exist, fix only genuine type errors now — do not restyle anything. Re-run until clean.

- [ ] **Step 8: Commit**

```bash
git add tsconfig.json tsconfig.node.json scripts/audit-design.mjs package.json package-lock.json
git commit -m "Add typecheck and design audit gates

The project had no tsconfig, no TypeScript, and no tests — Vite strips
types without checking them. A refactor touching every file had no
safety net.

- tsc --noEmit typechecking under strict mode
- scripts/audit-design.mjs enforces the spec's visual rules as an
  executable gate (no glow, no backdrop-blur, no neon tokens, no raw
  opacity colors, no window.prompt, single chrome height)
- npm run verify chains typecheck + audit + build

The audit currently fails, by design: its output is the work list."
```

---

### Task 2: Delete unused UI components

**Files:**
- Delete: `src/app/components/ui/` (all 46 `.tsx` files plus `utils.ts`, `use-mobile.ts`)
- Delete: `src/app/components/figma/ImageWithFallback.tsx` (verify unused first)
- Modify: `tsconfig.json` (remove the temporary `exclude` key)

**Interfaces:**
- Consumes: `npm run typecheck` from Task 1 — this is what proves nothing broke
- Produces: a `src/app/components/` directory containing only components the app imports

- [ ] **Step 1: Prove zero application imports before deleting**

```bash
grep -rn "components/ui\|from \"\./ui/\|from '\./ui/" src/app --include='*.tsx' --include='*.ts' \
  | grep -v "src/app/components/ui/" || echo "ZERO application imports — safe to delete"
```

Expected: `ZERO application imports — safe to delete`

**If this prints any file, STOP.** That file imports a ui component; do not delete that component. Report the finding rather than proceeding.

- [ ] **Step 2: Check the figma helper separately**

```bash
grep -rn "ImageWithFallback" src/ | grep -v "components/figma/"
```

Expected: no output. If there is output, keep `src/app/components/figma/`.

- [ ] **Step 3: Delete**

```bash
git rm -r src/app/components/ui
git rm -r src/app/components/figma   # only if Step 2 produced no output
```

- [ ] **Step 4: Remove the temporary tsconfig exclusion**

Task 1 excluded these directories from typechecking because they were about to
be deleted. They are now gone, so delete this line from `tsconfig.json`:

```json
"exclude": ["src/app/components/ui", "src/app/components/figma"],
```

Typecheck coverage over `src/` is now complete.

- [ ] **Step 5: Verify nothing broke**

Run: `npm run typecheck && npm run build`
Expected: both pass. The build output should show fewer modules transformed than
the 2068 baseline. If typecheck now reports errors in application code that the
exclusion was masking, fix them — they are real.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Remove 46 unused shadcn/ui components

Scaffold residue from the original Figma Make export. Verified by grep
that no application code imports any of them; typecheck and build pass
unchanged. Also drops the temporary tsconfig exclusion these directories
required, so typecheck now covers all of src/."
```

---

### Task 3: Strip unused dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2's deletion (these packages existed only for the deleted components)
- Produces: a dependency list matching actual imports; a measured bundle reduction

> **Corrected expectation (controller ruling R7).** The original plan predicted
> this task would cut the JS bundle from 977 kB to ~400 kB. **That was wrong.**
> Measurement after Task 2 proves the removed components were never imported, so
> their dependencies were never bundled: the built JS contains zero occurrences of
> radix, mui, recharts, embla, cmdk, vaul, slick, react-dnd, popper, or
> day-picker. Removing them **will not change the JS bundle**.
>
> What this task actually delivers: a smaller `node_modules` (444 MB / 181
> packages today), faster installs, and a much smaller supply-chain surface.
> Do not chase a JS bundle reduction — it will not come, and the task is not
> failing when it does not appear.
>
> The CSS win already landed in Task 2: deleting those files stopped Tailwind
> scanning them, cutting CSS from 129.11 kB to 63.49 kB (gzip 19.75 → 10.45).

- [ ] **Step 1: Record the baseline**

```bash
npm run build 2>&1 | grep -E "dist/assets.*\.(js|css)"
du -sh node_modules
ls node_modules | wc -l
```

Baseline after Task 2: JS `976.76 kB / gzip 282.98 kB`, CSS `63.49 kB / gzip
10.45 kB`, node_modules `444M`, `181` packages. Record all four.

- [ ] **Step 2: List what application code actually imports**

```bash
grep -rhoE "from ['\"][^.'\"][^'\"]*['\"]" src/ api/ \
  | sed -E "s/from ['\"]//; s/['\"]//" \
  | sed -E 's|^(@[^/]+/[^/]+).*|\1|; s|^([^@/]+)/.*|\1|' \
  | sort -u
```

Expected set: `clsx`, `livekit-client`, `livekit-server-sdk`, `lucide-react`, `motion`, `prismjs`, `react`, `react-dom`, `react-router-dom`, `react-simple-code-editor`.

- [ ] **Step 3: Remove everything not in that set**

```bash
npm uninstall \
  @emotion/react @emotion/styled @mui/icons-material @mui/material @popperjs/core \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress \
  @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot \
  @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle \
  @radix-ui/react-toggle-group @radix-ui/react-tooltip \
  class-variance-authority cmdk date-fns embla-carousel-react input-otp \
  next-themes react-day-picker react-dnd react-dnd-html5-backend react-hook-form \
  react-popper react-resizable-panels react-responsive-masonry react-slick \
  recharts sonner tailwind-merge vaul tw-animate-css
```

- [ ] **Step 4: Remove the `tw-animate-css` import**

`src/styles/tailwind.css` imports a package just uninstalled. Edit it to:

```css
@import 'tailwindcss' source(none);
@source '../**/*.{js,ts,jsx,tsx}';
```

- [ ] **Step 5: Verify and measure**

Run: `npm run typecheck && npm run audit && npm run build`
Expected: typecheck 0, build 0. The audit still exits 1 (474 violations) — that
is the redesign work list for later tasks and is not this task's concern.

Record: JS bundle, CSS bundle, `du -sh node_modules`, `ls node_modules | wc -l`.
**The JS bundle should be essentially unchanged** (~977 kB). node_modules and
the package count should drop substantially. If the JS bundle does drop, note
it — that would mean something removed *was* reachable, which is worth knowing.

**If the build fails on a missing module**, an import was missed in Step 2.
Reinstall only that one package and record why it is needed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/styles/tailwind.css
git commit -m "Remove unused dependencies

Drops ~35 packages that existed only for the deleted ui/ components:
all Radix primitives, MUI, Emotion, and the unused widget libraries.

node_modules: 444M -> <new>, 181 -> <new> packages.
JS bundle unchanged (~977 kB) as expected — these packages were never
imported, so they were never bundled. The win is install time and
supply-chain surface, not payload."
```

Replace `<new>` with the measured values before committing.

---

### Task 4: Design tokens and typography

The foundation every later task consumes. Nothing visual should be hardcoded after this.

**Files:**
- Rewrite: `src/styles/theme.css`
- Rewrite: `src/styles/fonts.css`
- Modify: `src/styles/globals.css`
- Modify: `package.json` (font packages)

**Interfaces:**
- Consumes: nothing
- Produces: Tailwind utilities used by every later task —
  `bg-ground bg-surface bg-raised`, `text-ink text-ink-muted text-ink-faint`,
  `border-line border-line-strong`, `bg-accent text-accent border-accent bg-accent-subtle`,
  `text-ok text-bad text-warn`, `h-chrome`, `rounded-control rounded-panel`,
  `font-sans font-mono`

- [ ] **Step 1: Install self-hosted fonts**

```bash
npm install @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

- [ ] **Step 2: Replace `src/styles/fonts.css` (currently empty — the single biggest reason the app reads as templated)**

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';
```

- [ ] **Step 3: Replace `src/styles/theme.css` entirely**

Delete the unused shadcn light/dark token block and replace with:

```css
@theme {
  /* Surfaces — depth comes from layering, never from glow */
  --color-ground: #0B0D10;
  --color-surface: #131720;
  --color-raised: #1A1F2A;

  /* Hairlines */
  --color-line: #242A35;
  --color-line-strong: #333B49;

  /* Text */
  --color-ink: #E8EAED;
  --color-ink-muted: #9BA3B0;
  --color-ink-faint: #646C7A;

  /* Accent — active state and focus ONLY. Never decoration. */
  --color-accent: #5B8DEF;
  --color-accent-hover: #7BA4F5;
  --color-accent-subtle: rgba(91, 141, 239, 0.12);

  /* Semantic — terminal output and arena results only */
  --color-ok: #4ADE80;
  --color-bad: #F87171;
  --color-warn: #FBBF24;

  /* One chrome height. Every bar in every column uses this. */
  --spacing-chrome: 3rem;

  /* Two radii */
  --radius-control: 6px;
  --radius-panel: 10px;

  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, 'SF Mono', monospace;
}

@layer base {
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: var(--color-ground);
    color: var(--color-ink);
    font-family: var(--font-sans);
  }

  /* Type scale — 11/12/13/14/16/20/24 with fixed weights.
     Tailwind utilities still override these. */
  h1 { font-size: 1.5rem;   font-weight: 600; line-height: 1.25; letter-spacing: -0.02em; }
  h2 { font-size: 1.25rem;  font-weight: 600; line-height: 1.3;  letter-spacing: -0.01em; }
  h3 { font-size: 1rem;     font-weight: 600; line-height: 1.4; }
  h4 { font-size: 0.875rem; font-weight: 600; line-height: 1.4; }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}
```

- [ ] **Step 4: Strip the glass utility from `src/styles/globals.css`**

Remove the `--color-neon-green` / `--color-neon-pink` `@theme` block and the
`.glass-panel` utility. Remove the `float` keyframes (Task 5 deletes their only
consumer). Keep `.custom-scrollbar` but retokenize it:

```css
@layer utilities {
  .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-line-strong);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--color-ink-faint);
  }
}
```

Keep the `blink` and `fadeInScale` keyframes if still referenced; delete `pulse` and `float`.

- [ ] **Step 5: Verify the build compiles with the new tokens**

Run: `npm run build`
Expected: passes. The app will look broken — components still reference deleted `neon-*` classes, which Tailwind now drops. That is expected and Tasks 5–9 fix it.

- [ ] **Step 6: Commit**

```bash
git add src/styles package.json package-lock.json
git commit -m "Add design token system and real typography

fonts.css was empty — the app rendered in system default sans, which is
the main reason it read as templated. Self-hosts Inter Variable and
JetBrains Mono Variable.

Replaces the unused shadcn light/dark token block with a single dark
token set: 3 surfaces, 2 hairlines, 3 text weights, 1 accent used only
for state, 3 semantic colors, one 48px chrome height, two radii."
```

---

### Task 5: Layout shell

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: tokens from Task 4
- Produces: a shell with a plain `bg-ground` and no decorative layers

- [ ] **Step 1: Delete the three stacked background layers**

Remove the entire `{/* Background Ambience */}` block (`layout.tsx:14-31`) — the
three animated blurred blobs, the dot grid, and the film grain. They compete with
content, cost GPU on every frame, and are a primary source of the generated look.

- [ ] **Step 2: Replace the root element**

```tsx
export default function Layout() {
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ground font-sans text-ink selection:bg-accent selection:text-ground">
      <TopNav onProfileClick={() => setIsSocialOpen(true)} />

      <main className="relative flex flex-1 overflow-hidden">
        <Outlet />
      </main>

      <SocialDrawer isOpen={isSocialOpen} onClose={() => setIsSocialOpen(false)} />
      <JoinRoomModal />
      <FloatingCallPanel />
    </div>
  );
}
```

The extra `relative z-10` wrapper div is no longer needed once the background
layers are gone.

- [ ] **Step 3: Delete the now-unused noise asset**

```bash
git rm public/noise.svg
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove decorative background layers from shell

Three stacked layers (animated blurred blobs, dot grid, film grain)
competed with content and animated continuously. Depth now comes from
surface tokens."
```

---

### Task 6: TopNav

**Files:**
- Modify: `src/app/components/TopNav.tsx`

**Interfaces:**
- Consumes: tokens from Task 4
- Produces: the 48px chrome contract that Tasks 7–8 match against

- [ ] **Step 1: Change the bar to `h-chrome` and remove the glass treatment**

The nav is currently `h-16 ... border-white/5 bg-black/40 backdrop-blur-xl`. Replace with:

```tsx
<nav className="relative z-50 flex h-chrome w-full items-center justify-between border-b border-line bg-surface px-4">
```

- [ ] **Step 2: Simplify the logo and delete the fake version string**

Remove the glow wrapper div, the `pulse` animation, and the `v2.0.4 stable` line entirely:

```tsx
<div className="flex items-center gap-2.5">
  <div className="flex h-7 w-7 items-center justify-center rounded-control bg-accent">
    <Zap className="h-4 w-4 text-ground" fill="currentColor" />
  </div>
  <span className="text-[15px] font-semibold tracking-tight text-ink">
    Code Along
  </span>
</div>
```

- [ ] **Step 3: Retokenize the tabs and drop the sliding glow pill**

```tsx
<div className="flex items-center gap-1">
  {tabs.map((tab) => {
    const isActive = currentPath === tab.id;
    return (
      <Link
        key={tab.id}
        to={tab.path}
        className={clsx(
          "flex items-center gap-2 rounded-control px-3 py-1.5 text-[13px] font-medium transition-colors",
          isActive
            ? "bg-accent-subtle text-accent"
            : "text-ink-muted hover:bg-raised hover:text-ink",
        )}
      >
        {tab.icon}
        {tab.label}
      </Link>
    );
  })}
</div>
```

The `motion.div` `layoutId="active-tab"` pill is removed — its only purpose was
carrying the glow.

- [ ] **Step 4: Retokenize the action buttons and use sentence case**

`JOIN ROOM` → `Join room`, `RUN CODE` → `Run`, `RUNNING...` → `Running…`.

```tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => openJoinModal()}
    className={clsx(
      "flex items-center gap-2 rounded-control border px-3 py-1.5 text-[13px] font-medium transition-colors",
      isConnected || pendingRoomId
        ? "border-accent/40 bg-accent-subtle text-accent"
        : "border-line-strong text-ink-muted hover:border-accent/40 hover:text-ink",
    )}
  >
    {isConnected ? (
      <span className="h-1.5 w-1.5 rounded-full bg-ok" />
    ) : (
      <Radio className="h-3.5 w-3.5" />
    )}
    <span className={clsx(activeRoomId && "font-mono")}>
      {activeRoomId || pendingRoomId || "Join room"}
    </span>
  </button>

  <button
    onClick={() => void runMode(currentPath as "collaborate" | "arena" | "whiteboard")}
    disabled={!canRun || isRunning}
    className={clsx(
      "flex items-center gap-2 rounded-control px-3 py-1.5 text-[13px] font-medium transition-colors",
      canRun && !isRunning
        ? "bg-accent text-ground hover:bg-accent-hover"
        : "cursor-not-allowed bg-raised text-ink-faint",
    )}
  >
    <Play className="h-3.5 w-3.5" fill="currentColor" />
    {isRunning ? "Running…" : "Run"}
  </button>

  <button
    onClick={onProfileClick}
    className="flex h-7 w-7 items-center justify-center rounded-full bg-raised font-mono text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink"
  >
    {displayName.slice(0, 2).toUpperCase()}
  </button>
</div>
```

The `animate-ping` halo, the gradient avatar, and the divider are all removed.

- [ ] **Step 5: Verify the audit no longer flags this file**

Run: `npm run audit 2>&1 | grep TopNav || echo "TopNav clean"`
Expected: `TopNav clean`

- [ ] **Step 6: Verify build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/TopNav.tsx
git commit -m "Retokenize TopNav; establish 48px chrome height

Removes glow shadows, backdrop-blur, the animate-ping halo, the gradient
avatar, and the hardcoded 'v2.0.4 stable' string. All-caps mono labels
become sentence case."
```

---

### Task 7: Sidebar — retokenize, fix doubled state, replace `window.prompt`

The largest single quality win in the plan: `window.prompt()` is the most visibly unfinished element in the app.

**Files:**
- Modify: `src/app/components/Sidebar.tsx`

**Interfaces:**
- Consumes: tokens from Task 4; `h-chrome` contract from Task 6; `createFile(parentId, name)` and `createFolder(parentId, name)` from `WorkspaceContext`
- Produces: an inline-input creation flow; no `window.*` dialogs anywhere

- [ ] **Step 1: Match the header to the chrome height**

Currently `h-12` with `bg-white/5` — `h-12` already equals 48px, so only the tokens change:

```tsx
<div className="flex h-chrome items-center justify-between border-b border-line px-3">
  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
    Explorer
  </span>
  <div className="flex items-center gap-1">
    <button
      onClick={() => setDraft({ kind: 'file' })}
      title="New file"
      className="rounded-control p-1 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
    >
      <Plus className="h-4 w-4" />
    </button>
    <button
      onClick={() => setDraft({ kind: 'folder' })}
      title="New folder"
      className="rounded-control p-1 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
    >
      <FolderPlus className="h-4 w-4" />
    </button>
  </div>
</div>
```

The decorative non-functional `<Search>` icon is removed — it was never wired to anything.

- [ ] **Step 2: Add draft state to the `Sidebar` component**

```tsx
type Draft = { kind: 'file' | 'folder' } | null;

export function Sidebar({ className }: { className?: string }) {
  const { root, selectedFolderId, createFile, createFolder } = useWorkspace();
  const [draft, setDraft] = useState<Draft>(null);

  const commitDraft = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && draft) {
        if (draft.kind === 'file') createFile(selectedFolderId, trimmed);
        else createFolder(selectedFolderId, trimmed);
      }
      setDraft(null);
    },
    [draft, createFile, createFolder, selectedFolderId],
  );
  // ...
}
```

Remove `handleCreateFile` and `handleCreateFolder` — both `window.prompt` call sites.

- [ ] **Step 3: Add the inline input component**

Place above `Sidebar` in the same file:

```tsx
function DraftInput({
  kind,
  onCommit,
  onCancel,
}: {
  kind: 'file' | 'folder';
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="flex items-center gap-2 rounded-control border border-accent/40 bg-accent-subtle px-2 py-1.5">
      {kind === 'folder' ? (
        <Folder className="h-4 w-4 shrink-0 text-ink-muted" />
      ) : (
        <FileCode2 className="h-4 w-4 shrink-0 text-ink-muted" />
      )}
      <input
        autoFocus
        value={value}
        placeholder={kind === 'file' ? 'main.py' : 'src'}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => (value.trim() ? onCommit(value) : onCancel())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit(value);
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}
```

- [ ] **Step 4: Render the draft input above the tree**

```tsx
<div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-2">
  {draft && (
    <DraftInput
      kind={draft.kind}
      onCommit={commitDraft}
      onCancel={() => setDraft(null)}
    />
  )}
  <TreeNode node={root} depth={0} />
</div>
```

- [ ] **Step 5: Fix the doubled active state in `TreeNode`**

Both branches currently render the highlight twice — once via `clsx` background
and again via an absolutely positioned `motion.div` carrying the same border and
background. Keep exactly one. For the file branch:

```tsx
const isActive = activeFileId === node.id;

return (
  <div
    onClick={() => setActiveFile(node.id)}
    style={{ marginLeft: depth * 12 }}
    className={clsx(
      "group flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-[13px] transition-colors",
      isActive
        ? "bg-accent-subtle text-accent"
        : "text-ink-muted hover:bg-raised hover:text-ink",
    )}
  >
    <FileNodeIcon fileName={node.name} />
    <span className="truncate font-mono">{node.name}</span>
    <button
      onClick={(event) => {
        event.stopPropagation();
        deleteNode(node.id);
      }}
      className="ml-auto rounded p-0.5 text-ink-faint opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </div>
);
```

Apply the same single-highlight treatment to the folder branch. The `motion`
import can be dropped from this file if nothing else uses it.

- [ ] **Step 6: Collapse `FileNodeIcon` to one tone**

Six unrelated hues (red/blue/cyan/yellow/blue-500) become one muted tone; the
active row already signals state via its background:

```tsx
function FileNodeIcon({ fileName }: { fileName: string }) {
  const cls = "h-4 w-4 shrink-0 text-ink-faint";
  if (fileName.endsWith('.json')) return <FileJson className={cls} />;
  if (fileName.endsWith('.css')) return <Hash className={cls} />;
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) return <FileText className={cls} />;
  if (/\.(c|cpp|cs)$/.test(fileName)) return <Braces className={cls} />;
  return <FileCode2 className={cls} />;
}
```

- [ ] **Step 7: Retokenize the aside and footer**

```tsx
<aside className={clsx("flex h-full w-[280px] shrink-0 select-none flex-col border-r border-line bg-surface", className)}>
```

Footer `SETTINGS` becomes sentence case `Settings` with `text-ink-faint`.

- [ ] **Step 8: Verify the audit passes for this file**

Run: `npm run audit 2>&1 | grep Sidebar || echo "Sidebar clean"`
Expected: `Sidebar clean` — in particular the `no-window-prompt` rule now passes.

- [ ] **Step 9: Verify build and manually test creation**

Run: `npm run typecheck && npm run build && npm run dev`

Manually: click **+**, type `test.py`, press Enter → file appears in the tree.
Click **+**, type something, press Escape → nothing is created.

- [ ] **Step 10: Commit**

```bash
git add src/app/components/Sidebar.tsx
git commit -m "Replace window.prompt with inline inputs; fix doubled active state

- New file/folder used native window.prompt(), the most visibly
  unfinished element in the app. Now inline inputs with Enter to
  confirm, Escape to cancel.
- TreeNode rendered its active highlight twice (clsx background plus an
  absolutely positioned motion.div with the same border and background).
- File icons collapse from six unrelated hues to one muted tone."
```

---

### Task 8: Page surfaces — Collaborate, Arena, Whiteboard

Mechanical retokenization across the three modes and their shared chrome.

**Files:**
- Modify: `src/app/pages/Collaborate.tsx`
- Modify: `src/app/pages/Arena.tsx`
- Modify: `src/app/pages/Whiteboard.tsx`
- Modify: `src/app/components/CodeEditor.tsx`
- Modify: `src/app/components/SocialDrawer.tsx`
- Modify: `src/app/components/JoinRoomModal.tsx`
- Modify: `src/app/components/FloatingCallPanel.tsx`
- Modify: `src/app/components/VideoBubbles.tsx`
- Modify: `src/app/components/CallParticipantTile.tsx`
- Modify: `src/styles/prism-theme.css`

**Interfaces:**
- Consumes: all tokens from Task 4; the `h-chrome` contract from Task 6
- Produces: an application source tree where `npm run audit` passes completely

- [ ] **Step 1: Work from the audit output as the checklist**

```bash
npm run audit
```

Every remaining line is a required edit. Apply this mapping consistently:

| Old | New |
|---|---|
| `bg-black/40`, `bg-black/20` | `bg-surface` |
| `bg-white/5`, `bg-white/10` | `bg-raised` |
| `border-white/5`, `border-white/10` | `border-line` |
| `border-white/20` | `border-line-strong` |
| `text-white` | `text-ink` |
| `text-white/60`, `text-white/50` | `text-ink-muted` |
| `text-white/40`, `text-white/30`, `text-white/25` | `text-ink-faint` |
| `text-neon-green`, `border-neon-green/*`, `bg-neon-green/*` | `text-accent`, `border-accent/40`, `bg-accent-subtle` |
| `text-cyan-300`, `border-cyan-400/*` | `text-accent`, `border-accent/40` |
| `text-red-400`, `bg-red-500/10` | `text-bad`, `bg-bad/10` |
| `shadow-[0_0_Npx_...]` | delete |
| `backdrop-blur-*` | delete |
| `rounded-md`, `rounded-lg` | `rounded-control` |
| `rounded-xl`, `rounded-2xl` | `rounded-panel` |

- [ ] **Step 2: Set the editor tab strip to the chrome height**

In `Collaborate.tsx` the tab strip is `h-10`. Change to `h-chrome` with
`border-b border-line bg-surface` so it aligns with the sidebar header across
the column boundary. This is the specific change that resolves the "half up half
down" misalignment.

- [ ] **Step 3: Retokenize the Prism theme**

`src/styles/prism-theme.css` carries its own syntax palette. Align it to the
token set: comments `--color-ink-faint`, strings `--color-ok`, keywords
`--color-accent`, numbers `--color-warn`, plain text `--color-ink`. Remove any
`text-shadow` declarations.

- [ ] **Step 4: Confirm the audit is fully clean**

Run: `npm run audit`
Expected: `✓ design audit clean` — exit 0.

- [ ] **Step 5: Verify build**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/app src/styles
git commit -m "Retokenize all page surfaces and shared chrome

Applies the token system across Collaborate, Arena, Whiteboard, editor,
call panels, and Prism theme. Editor tab strip moves to the 48px chrome
height so it aligns with the sidebar header across the column boundary.

npm run audit now passes."
```

---

### Task 9: Honest states

**Files:**
- Modify: `src/app/utils/executeCode.ts`
- Modify: `src/app/pages/Collaborate.tsx` (empty state)
- Modify: `src/app/pages/Arena.tsx` (waiting state)
- Modify: `src/app/context/SessionCallContext.tsx` (connection error surface)

**Interfaces:**
- Consumes: `executeCode`'s existing return shape; `LANGUAGE_LABELS`
- Produces: `isRuntimeAvailable(language: string): boolean` exported from `executeCode.ts`, consumed by the language picker

- [ ] **Step 1: Export a runtime-availability check**

JavaScript runs in-browser and always works. Everything else needs a configured
Piston instance, and the public `emkc.org` endpoint went whitelist-only in
February 2026.

```ts
/** JS runs in an in-browser Web Worker; all other languages need Piston. */
export function isRuntimeAvailable(language: string): boolean {
  return language === 'javascript';
}
```

- [ ] **Step 2: Surface it honestly in the terminal**

When a non-JS file is run and Piston returns a non-OK response, replace the
generic failure with an explicit message:

```ts
appendTerminalEntry(
  'system',
  `${LANGUAGE_LABELS[language]} runtime is not configured on this deployment. ` +
    `JavaScript runs in-browser and works without setup.`,
);
```

- [ ] **Step 3: Mark unavailable languages in the editor tab strip**

There is no language picker — language is inferred from the file extension by
`getLanguageFromFileName`, and the only place it surfaces to the user is the
language badge in the editor tab strip (`Collaborate.tsx:67`, rendering
`LANGUAGE_LABELS[file.language]`).

Mark the badge when the runtime is unavailable, so the state is visible before
the user hits Run:

```tsx
<span
  className={clsx(
    "font-mono text-[11px]",
    isActive ? "text-accent" : "text-ink-faint",
  )}
  title={
    isRunnableLanguage(file.language) && !isRuntimeAvailable(file.language)
      ? "Runtime not configured on this deployment"
      : undefined
  }
>
  {LANGUAGE_LABELS[file.language]}
  {isRunnableLanguage(file.language) && !isRuntimeAvailable(file.language) && (
    <span className="ml-1 text-ink-faint">·</span>
  )}
</span>
```

Import `isRuntimeAvailable` and the existing `isRunnableLanguage` from
`../utils/executeCode`.

- [ ] **Step 4: Add the Collaborate empty state**

When `openFiles.length === 0`:

```tsx
<div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
  <FileCode2 className="mb-2 h-8 w-8 text-ink-faint" />
  <p className="text-[15px] font-medium text-ink">No file open</p>
  <p className="text-[13px] text-ink-muted">
    Select a file from the explorer, or press + to create one.
  </p>
</div>
```

- [ ] **Step 5: Surface LiveKit connection failures**

`SessionCallContext` currently swallows token-endpoint errors. Expose a
`connectionError: string | null` on the context and render it in
`JoinRoomModal` so a misconfigured deployment says so instead of hanging on
"connecting".

- [ ] **Step 6: Verify**

Run: `npm run verify`
Expected: typecheck, audit, and build all pass.

Manually with `npm run dev`: close all tabs → empty state renders. Create
`test.py`, run it → the honest "not configured" message appears rather than a
generic error.

- [ ] **Step 7: Commit**

```bash
git add src/app
git commit -m "Add honest runtime, empty, and connection states

Non-JS languages need a configured Piston instance; the public emkc.org
endpoint went whitelist-only in Feb 2026. The picker and terminal now
say so explicitly instead of failing opaquely. Adds the Collaborate
empty state and surfaces LiveKit connection errors in the join modal."
```

---

### Task 10: Responsive layout

The app has 9 responsive utilities in total, so every mode breaks below desktop width.

**Files:**
- Modify: `src/app/layout.tsx` (owns the sidebar open/closed state)
- Modify: `src/app/components/Sidebar.tsx`
- Modify: `src/app/pages/Collaborate.tsx`
- Modify: `src/app/pages/Arena.tsx`
- Modify: `src/app/components/TopNav.tsx`

**Interfaces:**
- Consumes: the token system and chrome contract
- Produces: usable layouts at 768px and above. `Layout` owns
  `isSidebarOpen: boolean`, passing `onToggleSidebar: () => void` to `TopNav`
  and `isOpen: boolean` to `Sidebar`.

- [ ] **Step 1: Lift sidebar state into `Layout`**

The toggle button lives in `TopNav` but controls `Sidebar`, so the state belongs
in their common parent (`src/app/layout.tsx`, rewritten in Task 5):

```tsx
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

<TopNav
  onProfileClick={() => setIsSocialOpen(true)}
  onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
/>
```

`Sidebar` is rendered inside the page components, not `Layout`, so pass
`isSidebarOpen` down through the `Outlet` context:

```tsx
<main className="relative flex flex-1 overflow-hidden">
  <Outlet context={{ isSidebarOpen }} />
</main>
```

Pages read it with `useOutletContext<{ isSidebarOpen: boolean }>()` and forward
it to `Sidebar` as `isOpen`.

- [ ] **Step 2: Collapse the sidebar below `lg`**

`Sidebar` gains an `isOpen` prop. Below `lg` it shows only when toggled; at `lg`
and above it is always visible:

```tsx
export function Sidebar({ className, isOpen = false }: { className?: string; isOpen?: boolean }) {
  // ...
  <aside className={clsx(
    "h-full w-[280px] shrink-0 select-none flex-col border-r border-line bg-surface lg:flex",
    isOpen ? "flex" : "hidden",
    className,
  )}>
```

- [ ] **Step 3: Add the toggle button in TopNav**

`TopNav` gains `onToggleSidebar: () => void`. Render a `PanelLeft` icon button
before the logo, hidden at `lg` and above:

```tsx
<button
  onClick={onToggleSidebar}
  className="rounded-control p-1.5 text-ink-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
  title="Toggle explorer"
>
  <PanelLeft className="h-4 w-4" />
</button>
```

- [ ] **Step 4: Hide tab labels on narrow screens**

```tsx
<span className="hidden sm:inline">{tab.label}</span>
```

Icons remain, so navigation stays usable.

- [ ] **Step 5: Stack the Arena split vertically below `lg`**

Change the side-by-side editor panes to `flex-col lg:flex-row`.

- [ ] **Step 6: Verify at three widths**

Run: `npm run dev`, then check 1440px, 1024px, and 768px. No horizontal scroll;
all three modes usable at each width.

- [ ] **Step 7: Verify build**

Run: `npm run verify`
Expected: all three gates pass.

- [ ] **Step 8: Commit**

```bash
git add src/app
git commit -m "Add responsive layouts

The app had 9 responsive utilities total and broke below desktop width.
Sidebar collapses under lg with a toggle, tab labels drop to icons on
narrow screens, Arena stacks vertically."
```

---

### Task 11: Shell metadata

The app's distribution model is pasting a link to someone, so link previews matter.

**Files:**
- Modify: `index.html`
- Create: `public/favicon.svg`
- Create: `public/og.png` (1200×630)

**Interfaces:**
- Consumes: the accent color `#5B8DEF` and ground `#0B0D10`
- Produces: correct link previews and a browser-tab identity

- [ ] **Step 1: Create `public/favicon.svg`**

A filled `#5B8DEF` rounded square with the Zap glyph knocked out in `#0B0D10`,
matching the TopNav logo.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#5B8DEF"/>
  <path d="M17.5 5 9 18h5.5L13.5 27 23 13.5h-6L17.5 5Z"
        fill="#0B0D10" stroke="#0B0D10" stroke-width="1.5"
        stroke-linejoin="round"/>
</svg>
```

For `public/og.png`, render a 1200×630 canvas on `#0B0D10` with "Code Along" in
Inter Semibold `#E8EAED` at ~72px, the tagline "Collaborative coding workspace"
in `#9BA3B0` at ~32px beneath it, and the favicon mark at 96px above. Any tool is
fine — the constraint is the exact dimensions and the token colors.

- [ ] **Step 2: Replace the `<head>` of `index.html`**

It currently contains only a `<title>`.

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Code Along — collaborative coding workspace</title>
  <meta name="description" content="Real-time collaborative coding: multiplayer editor, 1v1 coding duels, and a shared whiteboard." />
  <meta name="theme-color" content="#0B0D10" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="Code Along" />
  <meta property="og:description" content="Real-time collaborative coding: multiplayer editor, 1v1 coding duels, and a shared whiteboard." />
  <meta property="og:image" content="/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: passes; `dist/favicon.svg` and `dist/og.png` are present.

- [ ] **Step 4: Commit**

```bash
git add index.html public/
git commit -m "Add shell metadata, favicon, and OG tags

index.html carried only a title. Shared links now render a proper
preview, which matters for an app distributed by pasting a URL."
```

---

### Task 12: Deploy and verify with two real participants

The blocker from the spec, and the first real test of multiplayer.

**Files:**
- Modify: `DEPLOYMENT.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above
- Produces: a publicly reachable URL with multiplayer confirmed working

- [ ] **Step 1: Confirm the SSO wall still stands before changing anything**

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://code-along-git-main-code-x-07s-projects.vercel.app/
```

Expected: `302` (redirect to Vercel SSO). This is the state being fixed.

- [ ] **Step 2: Disable deployment protection**

**This requires the user's explicit go-ahead — it makes the app publicly
reachable.** Confirm before proceeding.

In Vercel: **Project Settings → Deployment Protection → Vercel Authentication → Disabled → Save.**

- [ ] **Step 3: Push the branch and open a PR**

```bash
git push -u origin production-readiness
```

- [ ] **Step 4: Verify the preview deployment is publicly reachable**

```bash
curl -s -o /dev/null -w "%{http_code}\n" <preview-url>
```

Expected: `200`, not `302`.

- [ ] **Step 5: Verify the token endpoint works in production**

```bash
curl -s -X POST <preview-url>/api/livekit/token \
  -H 'Content-Type: application/json' \
  -d '{"roomName":"TEST01","participantName":"probe"}'
```

Expected: JSON containing `token` and `url`. A 500 means the env vars are not
reaching the function; a 401 means protection is still on.

- [ ] **Step 6: Verify multiplayer with two real participants**

This has never been done. In two independent browser profiles (or two devices),
open the preview URL and join the same room code. Confirm:

- both participants appear in the session drawer
- an edit by one appears in the other's editor
- video tiles connect both ways
- a whiteboard stroke by one renders for the other
- an Arena match starts with a synced countdown

Record anything that fails — latent multiplayer bugs are expected here, since
this path has never run with two people.

- [ ] **Step 7: Update the docs to match reality**

In `DEPLOYMENT.md`: note that deployment protection must stay disabled for
public sharing, and that non-JS execution requires self-hosted Piston.
In `README.md`: correct the quick-start to mention `npm run verify`.

- [ ] **Step 8: Commit and merge**

```bash
git add DEPLOYMENT.md README.md
git commit -m "Update deployment docs

Documents the deployment-protection requirement for public sharing and
the self-hosted Piston requirement for non-JS execution."
git push
```

---

## Verification

Full-project checks after Task 12:

```bash
npm run verify          # typecheck + audit + build, all must pass
```

Measured outcomes to confirm against the spec:

- [ ] CSS bundle reduced 129.11 kB → 63.49 kB (delivered by Task 2)
- [ ] `node_modules` and package count reduced (Task 3). **JS bundle stays
  ~977 kB** — see ruling R7; the removed packages were never imported, so they
  were never bundled.
- [ ] **Deferred, not in scope:** the 977 kB single chunk exceeds Vite's 500 kB
  warning and is dominated by `livekit-client` (8.6 MB installed). Code-splitting
  it behind the room-join flow is a real win but is new scope — raise it at the
  final review rather than expanding this plan.
- [ ] `npm run audit` exits 0 — zero glow, zero backdrop-blur, zero neon tokens, zero raw opacity colors, zero `window.prompt`, one chrome height
- [ ] `src/app/components/ui/` no longer exists
- [ ] Production URL returns 200 logged-out
- [ ] Two independent participants confirmed working in one room

## Risks

- **Task 12 Step 2 makes the app publicly reachable.** Execution is in-browser JS
  only and rate limiting stays enabled, but this is a deliberate exposure
  decision and needs explicit confirmation.
- **Task 3 may over-remove.** If the build fails on a missing module, reinstall
  only that package and record why it is needed.
- **Task 12 Step 6 is the first real multiplayer test.** Budget for latent bugs;
  they are findings, not plan failures.
