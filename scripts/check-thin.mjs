#!/usr/bin/env node
// Contrôle du contenu mince sur les pages PUBLIÉES, générées ou non.
//
//   node scripts/check-thin.mjs
//   node scripts/check-thin.mjs --min 400
//
// Pourquoi ce script existe : `gen-pages.mjs --audit` ne mesure que ce qu'il
// génère lui-même. Les pages écrites à la main échappaient donc entièrement au
// seuil — c'est ainsi que 19 pages entre 249 et 391 mots sont restées en ligne
// sans qu'aucun contrôle ne les signale. Ici on lit le disque, pas les données.
//
// Le comptage est celui de usefulWordCount : hors balises, hors JSON-LD, hors
// signature et hors bloc sources/contact — c'est-à-dire le texte que le lecteur
// lit réellement, pas le balisage qui l'entoure.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { usefulWordCount } from './lib/template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const args = process.argv.slice(2);
const i = args.indexOf('--min');
const MIN = i === -1 ? 400 : Number(args[i + 1]);

// Dossiers d'actifs : ils contiennent du HTML qui n'est pas une page.
const SKIP_DIRS = new Set(['fonts', 'icons', 'aso', 'img']);

// Pages légitimement courtes. Une mention légale n'a pas à faire 400 mots, et
// un hub vaut par ses liens, pas par sa prose. Toute AUTRE page doit tenir le
// seuil : cette liste est une exception assumée, pas un tapis pour la poussière.
const EXEMPT = new Set([
  'privacy.html',
  'en/privacy.html',
  'sourates.html',
  'offline.html',
  '404.html',
]);

const EXCLUDE = [/^_/, /(^|\/)_/, /^sw[-.]/];

function walk(dir, base = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      out.push(...walk(path.join(dir, e.name), rel));
    } else if (e.name.endsWith('.html') && !EXCLUDE.some((r) => r.test(rel))) {
      out.push(rel);
    }
  }
  return out;
}

const thin = [];
let checked = 0;

for (const rel of walk(PUBLIC)) {
  if (EXEMPT.has(rel)) continue;
  checked++;
  const words = usefulWordCount(readFileSync(path.join(PUBLIC, rel), 'utf8'));
  if (words < MIN) thin.push({ rel, words });
}

thin.sort((a, b) => a.words - b.words);

console.log(`Contenu mince — ${checked} page(s) mesurée(s), seuil ${MIN} mots utiles`);
if (!thin.length) {
  console.log('Aucune page sous le seuil.');
  process.exit(0);
}

console.log(`\n${thin.length} page(s) sous le seuil :`);
for (const t of thin) console.log(`  ${String(t.words).padStart(4)}  ${t.rel}`);
console.log('\nÉtoffe ces pages, ou ajoute-les à EXEMPT si elles sont');
console.log('légitimement courtes (mention légale, hub de liens).');
process.exit(1);
