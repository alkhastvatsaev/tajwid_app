#!/usr/bin/env node
// Soumet des URLs à IndexNow (Bing, Yandex, Naver, Seznam).
//
//   node scripts/seo-ping.mjs                    → toutes les URLs du sitemap
//   node scripts/seo-ping.mjs --since HEAD~1     → seulement les pages touchées
//   node scripts/seo-ping.mjs --url https://…    → une URL précise
//   node scripts/seo-ping.mjs --dry              → montre sans envoyer
//
// La clé est déjà publiée et vérifiée sur le domaine.

import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, LANGS, prefix } from './lib/template.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const KEY = 'a7c3e91f-4b2d-8e06-c1a9-4f70b5d3e28a';
const HOST = 'tilmidh.app';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? null : args[i + 1];
};
const DRY = args.includes('--dry');

function routeOf(rel) {
  let p = rel.replace(/^public\//, '').replace(/\.html$/, '');
  if (p === 'index') return `${SITE}/`;
  const seg = p.split('/');
  if (LANGS.includes(seg[0]) && seg[0] !== 'fr') {
    const rest = seg.slice(1).join('/');
    return `${SITE}${prefix(seg[0])}${rest ? `/${rest}` : '/'}`;
  }
  if (LANGS.includes(p) && p !== 'fr') return `${SITE}${prefix(p)}/`;
  return `${SITE}/${p}`;
}

async function urlsFromSitemap() {
  const xml = await readFile(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function urlsSince(ref) {
  const { stdout } = await exec('git', ['diff', '--name-only', ref, '--', 'public'], { cwd: ROOT });
  return stdout
    .split('\n')
    .filter((f) => f.endsWith('.html'))
    .map(routeOf);
}

const one = flag('url');
const since = flag('since');
let urls = one ? [one] : since ? await urlsSince(since) : await urlsFromSitemap();
urls = [...new Set(urls)].filter(Boolean);

if (!urls.length) {
  console.log('Aucune URL à soumettre.');
  process.exit(0);
}

console.log(`${urls.length} URL(s) :`);
for (const u of urls.slice(0, 12)) console.log(`  ${u}`);
if (urls.length > 12) console.log(`  … et ${urls.length - 12} autres`);

if (DRY) {
  console.log('\n--dry : rien envoyé.');
  process.exit(0);
}

// IndexNow accepte jusqu'à 10 000 URLs par requête.
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
});

// 200 = accepté, 202 = accepté en attente de validation de la clé.
console.log(`\nIndexNow → HTTP ${res.status}${res.status === 202 ? ' (accepté, clé en validation)' : ''}`);
if (!res.ok && res.status !== 202) {
  console.log(await res.text());
  process.exitCode = 1;
}
