#!/usr/bin/env node
// Génère les visuels OG + in-page (3 couleurs, arabe TilmidhTajweed) et injecte dans le HTML.
//
//   node scripts/gen-og.mjs
//   node scripts/gen-og.mjs --dry

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from './lib/og-render.mjs';
import { SITE, LANGS } from './lib/template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
const EXCLUDE = [/^offline\.html$/, /^aso\//, /^sw[-.]/, /^404\.html$/, /^_preview/];

const FONT = path.join(PUBLIC, 'fonts', 'TilmidhTajweed-Regular.ttf');
const TMP = path.join(ROOT, '.tmp-og.svg');

const { palette, cards } = JSON.parse(await readFile(path.join(ROOT, 'data', 'og-cards.json'), 'utf8'));

/** "en/regle/qalqalah.html" → { lang, route } */
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

function cardIdForRoute(route) {
  if (route === '/') return 'home';
  if (route.includes('ayat-kursi')) return 'kursi';
  if (route.includes('sourate/112')) return 'ikhlas';
  if (route.includes('sourate/113')) return 'falaq';
  if (route.includes('sourate/114')) return 'nas';
  if (route.includes('sourate/67')) return 'mulk';
  if (route.includes('sourate/1')) return 'fatihah';
  if (route.includes('regle/qalqalah')) return 'qalqalah';
  if (route.includes('regle/ghunnah')) return 'ghunnah';
  if (route.includes('regle/madd')) return 'madd';
  if (route.includes('regle/ikhfa')) return 'ikhfa';
  if (route.includes('regle/idgham')) return 'idgham';
  if (route.includes('tajwid-microphone')) return 'mic';
  if (route.includes('apprendre-tajwid')) return 'tajwid';
  if (route.includes('regles-de-tajwid')) return 'rules-hub';
  if (route.includes('coran-phonetique')) return 'phonetic';
  if (route.includes('best-tajwid-app-for-beginners')) return 'pemula';
  if (route.includes('meilleure-app-apprendre-lire-coran')) return 'lire-coran';
  if (route === '/sourates') return 'phonetic';
  if (route.includes('prilozhenie-tadzhvida')) return 'pemula';
  if (route.includes('privacy')) return 'privacy';
  return 'home';
}

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

function heroBlock(pagePath, alt) {
  return `        <figure class="hero-img">
            <img src="${pagePath}" alt="${alt.replace(/"/g, '&quot;')}" width="960" height="540" loading="lazy" decoding="async">
        </figure>`;
}

const HERO_CSS = `        .hero-img { margin: 0 0 1.4rem; border-radius: 12px; overflow: hidden; background: #51A26A; }
        .hero-img img { display: block; width: 100%; height: auto; }`;

function injectHtml(html, { ogUrl, alt, pagePath, isIndex }) {
  let out = html;

  // og:image + twitter
  out = out.replace(/<meta property="og:image" content="[^"]*">\n?/g, '');
  out = out.replace(/<meta property="og:image:width"[^>]*>\n?/g, '');
  out = out.replace(/<meta property="og:image:height"[^>]*>\n?/g, '');
  out = out.replace(/<meta property="og:image:alt"[^>]*>\n?/g, '');
  out = out.replace(/<meta name="twitter:image" content="[^"]*">\n?/g, '');

  out = out.replace(/<meta name="twitter:card" content="[^"]*">\n?/g, '');

  const ogBlock = [
    `    <meta property="og:image" content="${SITE}${ogUrl}">`,
    `    <meta property="og:image:width" content="1200">`,
    `    <meta property="og:image:height" content="630">`,
    `    <meta property="og:image:alt" content="${alt.replace(/"/g, '&quot;')}">`,
    `    <meta name="twitter:card" content="summary_large_image">`,
    `    <meta name="twitter:image" content="${SITE}${ogUrl}">`,
  ].join('\n');

  if (out.includes('property="og:url"')) {
    out = out.replace(/(<meta property="og:url"[^>]*>\n)/, `$1${ogBlock}\n`);
  } else if (out.includes('property="og:title"')) {
    out = out.replace(/(<meta property="og:title"[^>]*>\n)/, `$1${ogBlock}\n`);
  }

  // In-page hero: first visual after h1 (WebP 960×540). Skip the app monolith.
  if (!isIndex) {
    out = out.replace(/\s*<figure class="hero-img">[\s\S]*?<\/figure>\s*/g, '\n');
    const hero = heroBlock(pagePath, alt);
    if (/<h1[\s\S]*?<\/h1>/.test(out)) {
      out = out.replace(/(<h1[\s\S]*?<\/h1>)/, `$1\n${hero}`);
    }
    if (!out.includes('.hero-img {')) {
      out = out.replace('</style>', `${HERO_CSS}\n    </style>`);
    }
  }

  return out;
}

const rendered = new Map();
let images = 0;
let patched = 0;

async function ensureImage(cardId, lang) {
  const key = `${cardId}:${lang}`;
  if (rendered.has(key)) return rendered.get(key);

  const card = cards[cardId];
  if (!card) throw new Error(`Carte inconnue: ${cardId}`);

  const slug = card.slugs[lang] || card.slugs.en || cardId;
  const ogUrl = `/img/og/${lang}/${slug}.png`;
  const pageUrl = `/img/page/${lang}/${slug}.webp`;
  const ogOut = path.join(PUBLIC, ogUrl.slice(1));
  const pageOut = path.join(PUBLIC, pageUrl.slice(1));

  if (!DRY) {
    await renderCard({
      arabic: card.arabic,
      shape: card.shape,
      title: card.titles[lang] || card.titles.en,
      fontPath: FONT,
      palette,
      ogOut,
      pageOut,
      tmpSvg: TMP,
    });
    images++;
  }

  const meta = {
    ogUrl,
    pageUrl,
    alt: card.alts[lang] || card.alts.en,
    title: card.titles[lang] || card.titles.en,
  };
  rendered.set(key, meta);
  return meta;
}

// Copie home FR → og.png (logo partage racine)
const homeMeta = await ensureImage('home', 'fr');
if (!DRY) {
  const ogRoot = path.join(PUBLIC, 'og.png');
  await writeFile(ogRoot, await readFile(path.join(PUBLIC, homeMeta.ogUrl.slice(1))));
}

for (const rel of await walk(PUBLIC)) {
  const { lang, route } = parseRel(rel);
  const cardId = cardIdForRoute(route);
  const meta = await ensureImage(cardId, lang);
  const file = path.join(PUBLIC, rel);
  let html = await readFile(file, 'utf8');
  const isIndex = rel === 'index.html';
  const next = injectHtml(html, { ...meta, pagePath: meta.pageUrl, isIndex });

  if (next !== html) {
    if (!DRY) await writeFile(file, next, 'utf8');
    patched++;
    console.log(`✓ ${rel} → ${meta.ogUrl}`);
  }
}

console.log(`\n${images} image(s) générée(s), ${patched} page(s) patchée(s)${DRY ? ' (dry-run)' : ''}`);
