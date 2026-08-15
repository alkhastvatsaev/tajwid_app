#!/usr/bin/env node
// Complète les balises hreflang manquantes dans les pages écrites à la main.
//
//   node scripts/fix-hreflang.mjs           → corrige
//   node scripts/fix-hreflang.mjs --dry     → montre sans écrire
//
// Le groupe de référence est l'ensemble des fichiers réellement présents pour
// une même route. Une page qui oublie une langue du groupe casse la
// réciprocité, et Google ignore alors le groupe entier.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, LANGS, prefix } from './lib/template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
// Les fichiers préfixés par _ sont des brouillons de travail (ex. _preview-mushaf) :
// jamais dans le sitemap, jamais dans un groupe hreflang.
const EXCLUDE = [/^offline\.html$/, /^aso\//, /^sw[-.]/, /^404\.html$/, /(^|\/)_/];

async function walk(dir, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (['fonts', 'icons', 'aso', 'img'].includes(e.name)) continue;
      out.push(...(await walk(path.join(dir, e.name), rel)));
    } else if (e.name.endsWith('.html') && !EXCLUDE.some((r) => r.test(rel))) {
      out.push(rel);
    }
  }
  return out;
}

function parse(rel) {
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

const urlOf = (lang, route) => `${SITE}${prefix(lang)}${route === '/' && prefix(lang) ? '' : route}`;

const files = await walk(PUBLIC);
const groups = new Map();
for (const rel of files) {
  const { lang, route } = parse(rel);
  if (!groups.has(route)) groups.set(route, new Map());
  groups.get(route).set(lang, rel);
}

let fixed = 0;
for (const [route, langs] of groups) {
  const present = LANGS.filter((l) => langs.has(l));
  for (const lang of present) {
    const rel = langs.get(lang);
    const file = path.join(PUBLIC, rel);
    let html = await readFile(file, 'utf8');

    const declared = new Set(
      [...html.matchAll(/rel="alternate"\s+hreflang="([a-z-]+)"/g)].map((m) => m[1])
    );
    const missing = present.filter((l) => !declared.has(l));
    if (!missing.length) continue;

    const lines = missing
      .map((l) => `    <link rel="alternate" hreflang="${l}" href="${urlOf(l, route)}">`)
      .join('\n');

    // On insère avant x-default s'il existe, sinon après le dernier hreflang,
    // sinon juste après le canonical.
    const xdef = html.match(/[ \t]*<link rel="alternate" hreflang="x-default"[^>]*>\n/);
    const lastAlt = [...html.matchAll(/[ \t]*<link rel="alternate" hreflang="[a-z-]+"[^>]*>\n/g)].pop();
    const canon = html.match(/[ \t]*<link rel="canonical"[^>]*>\n/);

    if (xdef) {
      html = html.replace(xdef[0], `${lines}\n${xdef[0]}`);
    } else if (lastAlt) {
      html = html.replace(lastAlt[0], `${lastAlt[0]}${lines}\n`);
    } else if (canon) {
      html = html.replace(canon[0], `${canon[0]}${lines}\n`);
    } else {
      console.log(`  ${rel} : aucun point d'insertion trouvé, ignoré`);
      continue;
    }

    console.log(`  ${DRY ? 'à corriger' : 'corrigé'} ${rel} → +${missing.join(', ')}`);
    if (!DRY) await writeFile(file, html, 'utf8');
    fixed++;
  }
}

console.log(fixed ? `\n${fixed} fichier(s)` : 'Aucun écart hreflang');
