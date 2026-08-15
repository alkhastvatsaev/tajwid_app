#!/usr/bin/env node
// Injecte le bloc media-illu (Basmala mot-à-mot) + CSS + script léger.
//
//   node scripts/enrich-illu.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, renderHeroBlock } from './lib/template.mjs';
import {
  ILLU_CSS,
  ILLU_SCRIPTS,
  illuIdForRoute,
  getCaption,
  renderIlluBlock,
} from './lib/illustrations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
const EXCLUDE = [
  /^offline\.html$/,
  /^index\.html$/,
  /^aso\//,
  /^sw[-.]/,
  /^404\.html$/,
  /^_preview/,
  /^fonts\//,
];

function parseRel(rel) {
  let p = rel.replace(/\.html$/, '');
  if (p === 'index') return { lang: 'fr', route: '/' };
  const seg = p.split('/');
  if (LANGS.includes(seg[0]) && seg[0] !== 'fr') {
    const rest = seg.slice(1).join('/');
    return { lang: seg[0], route: rest ? `/${rest}` : '/' };
  }
  if (LANGS.includes(p) && p !== 'fr') return { lang: p, route: '/' };
  return { lang: 'fr', route: `/${p}` };
}

async function walk(dir, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (['fonts', 'icons', 'aso', 'img', 'js'].includes(e.name)) continue;
      out.push(...(await walk(path.join(dir, e.name), rel)));
    } else if (e.name.endsWith('.html') && !EXCLUDE.some((r) => r.test(rel))) {
      out.push(rel);
    }
  }
  return out;
}

function injectCss(html) {
  if (!html.includes('</style>')) return html;
  let out = html;
  // Strip any previous media-illu / hero / illu-svg CSS blobs
  out = out.replace(/\n?\s*\.media-illu[\s\S]*?\.media-video \{ display: none; \}(?:\s*@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\s*\})?/g, '\n');
  out = out.replace(/\n?\s*@font-face \{\s*font-family: 'KFGQPC Colored'[\s\S]*?font-display: swap;\s*\}/g, '\n');
  out = out.replace(/\n?\s*@font-face \{\s*font-family: 'KFGQPC Mono'[\s\S]*?font-display: swap;\s*\}/g, '\n');
  out = out.replace(/\n?\s*@keyframes (?:illu|demo|pip)-[\s\S]*?\n\s*\}/g, '\n');
  if (!out.includes('.hero-img {')) {
    out = out.replace(
      '</style>',
      `        .hero-img { margin: 0 0 1.4rem; border-radius: 12px; overflow: hidden; background: #51A26A; }
        .hero-img img { display: block; width: 100%; height: auto; }
    </style>`
    );
  }
  return out.replace('</style>', `${ILLU_CSS}\n    </style>`);
}

function injectBlock(html, block) {
  if (html.includes('class="media-illu"')) {
    return html.replace(
      /\s*<figure class="media-illu"[\s\S]*?<\/figure>\s*(?:<!-- \.media-video reserved for later -->)?/,
      `\n${block}\n`
    );
  }
  if (html.includes('class="hero-img"')) {
    return html.replace(
      /(<figure class="hero-img">[\s\S]*?<\/figure>)/,
      `$1\n${block}`
    );
  }
  if (/<h1[\s\S]*?<\/h1>/.test(html)) {
    return html.replace(/(<h1[\s\S]*?<\/h1>)/, `$1\n${block}`);
  }
  return html;
}

function injectHero(html, lang, route) {
  const block = renderHeroBlock(lang, route);
  let out = html.replace(/\s*<figure class="hero-img">[\s\S]*?<\/figure>\s*/g, '\n');
  if (/<h1[\s\S]*?<\/h1>/.test(out)) {
    return out.replace(/(<h1[\s\S]*?<\/h1>)/, `$1\n${block}`);
  }
  return out;
}

function discourageReader(html) {
  if (html.includes('class="page-root')) return html;
  return html.replace(
    /<main>([\s\S]*?)<\/main>/,
    `<main>\n    <ol class="page-root copy-sidebar" role="presentation">\n      <li>$1</li>\n    </ol>\n    </main>`
  );
}

function injectScripts(html) {
  let out = html.replace(
    /\s*<script defer src="\/js\/(?:vendor\/(?:vivus|anime)\.min|illu-motion)\.js"><\/script>/g,
    ''
  );
  if (!out.includes('</body>')) return out;
  return out.replace('</body>', `${ILLU_SCRIPTS}\n</body>`);
}

function injectFontPreload(html) {
  if (html.includes('KFGQPCHAFSColored-Bold.woff2')) return html;
  const preload = `    <link rel="preload" href="/fonts/KFGQPCHAFSColored-Bold.woff2?v=chromatic-2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/KFGQPCHAFSColored-Mono.woff2?v=2" as="font" type="font/woff2" crossorigin>
`;
  if (html.includes('</title>')) {
    return html.replace('</title>', `</title>\n${preload}`);
  }
  return html;
}

let patched = 0;
for (const rel of await walk(PUBLIC)) {
  const { lang, route } = parseRel(rel);
  const file = path.join(PUBLIC, rel);
  let html = await readFile(file, 'utf8');
  const illuId = illuIdForRoute(route);
  const block = renderIlluBlock({
    illuId,
    lang,
    caption: getCaption(lang, illuId),
  });

  let   next = injectFontPreload(html);
  next = injectCss(next);
  next = injectHero(next, lang, route);
  next = injectBlock(next, block);
  next = discourageReader(next);
  next = injectScripts(next);

  if (next !== html) {
    if (!DRY) await writeFile(file, next, 'utf8');
    patched++;
    console.log(`✓ ${rel} → ${illuId}`);
  }
}
console.log(`\n${patched} page(s) enrichie(s)`);
