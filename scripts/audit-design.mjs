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
    pattern: /shadow-\[0_0_(?!0_)/g,
    message: 'Glow shadow. Use surface layering and hairline borders instead.',
  },
  {
    name: 'no-backdrop-blur',
    pattern: /backdrop-blur/g,
    message: 'backdrop-blur is part of the removed glass look.',
  },
  {
    name: 'no-neon',
    pattern: /\bneon-[a-z]+/g,
    message: 'neon-* tokens are removed. Use accent / ink / line tokens.',
  },
  {
    name: 'no-raw-opacity-colors',
    pattern: /\b(?:bg|text|border|from|via|to)-(?:white|black)\/\d+/g,
    message: 'Raw white/black opacity. Use the @theme tokens.',
  },
  {
    name: 'no-adhoc-palette',
    pattern: /\b(?:bg|text|border|from|via|to|ring|fill|stroke|divide|outline|accent|caret|decoration|placeholder|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    message: 'Ad-hoc palette color. Use ground/surface/raised, ink*, line*, accent*, ok/bad/warn.',
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
