#!/usr/bin/env node
// Régénère public/sitemap.xml depuis les fichiers réellement présents.
//
//   node scripts/gen-sitemap.mjs           → écrit le sitemap
//   node scripts/gen-sitemap.mjs --check   → n'écrit rien, signale les écarts
//
// Trois différences avec le sitemap écrit à la main :
//  1. les annotations hreflang sont déduites des fichiers existants, donc
//     toujours réciproques (9 URLs divergeaient au 14 août) ;
//  2. <lastmod> vient de la date du dernier commit touchant le fichier ;
//  3. plus de <priority> ni <changefreq> — Google les ignore.

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, LANGS, prefix } from './lib/template.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const CHECK = process.argv.includes('--check');

// Pages hors index : elles portent un noindex ou ne sont pas du contenu.
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
    } else if (e.name.endsWith('.html')) {
      if (!EXCLUDE.some((r) => r.test(rel))) out.push(rel);
    }
  }
  return out;
}

/** "en/regle/qalqalah.html" → { lang:"en", route:"/regle/qalqalah" } */
function parse(rel) {
  let p = rel.replace(/\.html$/, '');
  if (p === 'index') return { lang: 'fr', route: '/' };
  const seg = p.split('/');
  const maybeLang = seg[0];
  if (LANGS.includes(maybeLang) && maybeLang !== 'fr') {
    const rest = seg.slice(1).join('/');
    return { lang: maybeLang, route: rest ? `/${rest}` : '/' };
  }
  // /en.html, /id.html … sont les accueils de langue
  if (LANGS.includes(p) && p !== 'fr') return { lang: p, route: '/' };
  return { lang: 'fr', route: `/${p}` };
}

async function lastmod(file) {
  try {
    const { stdout } = await exec('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT });
    if (stdout.trim()) return stdout.trim();
  } catch {}
  const s = await stat(file);
  return s.mtime.toISOString().slice(0, 10);
}

async function main() {
  const files = await walk(PUBLIC);
  const byRoute = new Map(); // route → Map(lang → {rel, url})

  for (const rel of files) {
    const { lang, route } = parse(rel);
    if (!byRoute.has(route)) byRoute.set(route, new Map());
    byRoute.get(route).set(lang, { rel, url: `${SITE}${prefix(lang)}${route === '/' && prefix(lang) ? '' : route}` });
  }

  const entries = [];
  const issues = [];

  for (const [route, langs] of [...byRoute.entries()].sort()) {
    const present = LANGS.filter((l) => langs.has(l));
    for (const lang of present) {
      const { rel, url } = langs.get(lang);
      const file = path.join(PUBLIC, rel);
      const mod = await lastmod(file);

      // contrôle : la page déclare-t-elle bien tout le groupe ?
      const html = await readFile(file, 'utf8');
      const declared = [...html.matchAll(/hreflang="([a-z-]+)"/g)]
        .map((m) => m[1])
        .filter((l) => l !== 'x-default');
      const missing = present.filter((l) => !declared.includes(l));
      if (missing.length) {
        issues.push(`${rel} : hreflang manquant → ${missing.join(', ')}`);
      }

      entries.push({ url, mod, alternates: present.map((l) => ({ l, href: langs.get(l).url })) });
    }
  }

  if (issues.length) {
    console.log(`${issues.length} écart(s) hreflang entre les pages et les fichiers :`);
    for (const i of issues) console.log(`  ${i}`);
    console.log('');
  } else {
    console.log('hreflang : aucun écart\n');
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map((e) =>
      [
        '  <url>',
        `    <loc>${e.url}</loc>`,
        `    <lastmod>${e.mod}</lastmod>`,
        ...e.alternates.map(
          (a) => `    <xhtml:link rel="alternate" hreflang="${a.l}" href="${a.href}"/>`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${
          e.alternates.find((a) => a.l === 'id')?.href ?? `${SITE}/id`
        }"/>`,
        '  </url>',
      ].join('\n')
    ),
    '</urlset>',
    '',
  ].join('\n');

  const out = path.join(PUBLIC, 'sitemap.xml');
  if (CHECK) {
    const current = existsSync(out) ? await readFile(out, 'utf8') : '';
    const same = current === xml;
    console.log(same ? 'sitemap.xml : à jour' : 'sitemap.xml : DÉSYNCHRONISÉ — relancer sans --check');
    process.exitCode = same && !issues.length ? 0 : 1;
    return;
  }

  await writeFile(out, xml, 'utf8');
  console.log(`sitemap.xml écrit — ${entries.length} URLs`);
  if (issues.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
