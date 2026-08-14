#!/usr/bin/env node
// Met x-default → variante indonésienne (ou /id si pas de page ID pour cette route).
//
//   node scripts/fix-x-default.mjs
//   node scripts/fix-x-default.mjs --dry

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './lib/template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
const EXCLUDE = [/^offline\.html$/, /^aso\//, /^sw[-.]/, /^404\.html$/];

async function walk(dir, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (['fonts', 'icons', 'aso'].includes(e.name)) continue;
      out.push(...(await walk(path.join(dir, e.name), rel)));
    } else if (e.name.endsWith('.html') && !EXCLUDE.some((r) => r.test(rel))) {
      out.push(rel);
    }
  }
  return out;
}

const xDefaultLine = (href) =>
  `    <link rel="alternate" hreflang="x-default" href="${href}">\n`;

let updated = 0;
for (const rel of await walk(PUBLIC)) {
  const file = path.join(PUBLIC, rel);
  let html = await readFile(file, 'utf8');
  if (!html.includes('hreflang=')) continue;

  const idMatch = html.match(/<link rel="alternate" hreflang="id" href="([^"]+)">/);
  const target = idMatch ? idMatch[1] : `${SITE}/id`;
  const line = xDefaultLine(target);
  const existing = html.match(/[ \t]*<link rel="alternate" hreflang="x-default" href="[^"]*">\n?/);

  if (existing) {
    if (existing[0].includes(target)) continue;
    html = html.replace(existing[0], line);
  } else {
    const lastAlt = [...html.matchAll(/[ \t]*<link rel="alternate" hreflang="(?!x-default)[^"]+"[^>]*>\n/g)].pop();
    if (!lastAlt) continue;
    html = html.replace(lastAlt[0], `${lastAlt[0]}${line}`);
  }

  console.log(`${DRY ? '→' : '✓'} ${rel} x-default → ${target}`);
  if (!DRY) await writeFile(file, html, 'utf8');
  updated++;
}

console.log(updated ? `\n${updated} fichier(s)` : 'Aucun changement x-default');
