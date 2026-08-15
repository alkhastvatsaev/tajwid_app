#!/usr/bin/env node
// Complète les pages écrites à la main, que le générateur ne produit pas.
//
//   node scripts/patch-static.mjs         → corrige
//   node scripts/patch-static.mjs --dry   → montre sans écrire
//
// Trois manques relevés par l'audit technique du 14 août, sur 39 pages / 78 :
//  1. aucun JSON-LD → aucun rattachement à la marque ;
//  2. canonical sans slash final alors que le sitemap déclare la forme AVEC
//     slash pour les accueils de langue → deux formes d'URL en concurrence ;
//  3. <meta name="robots"> absent (pas bloquant, mais incohérent d'une page à l'autre).
//
// Le script AJOUTE uniquement. Il ne réécrit jamais un JSON-LD existant :
// une page qui a déjà son graphe, ou un FAQPage, est laissée intacte.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, LANGS, prefix } from './lib/template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DRY = process.argv.includes('--dry');
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

/** "id/regle/madd.html" → { lang, route } ; "id.html" → { lang:'id', route:'/' } */
function parse(rel) {
  const p = rel.replace(/\.html$/, '');
  if (p === 'index') return { lang: 'fr', route: '/' };
  const seg = p.split('/');
  if (LANGS.includes(seg[0]) && seg[0] !== 'fr') {
    const rest = seg.slice(1).join('/');
    return { lang: seg[0], route: rest ? `/${rest}` : '/' };
  }
  if (LANGS.includes(p) && p !== 'fr') return { lang: p, route: '/' };
  return { lang: 'fr', route: `/${p}` };
}

/** Forme d'URL canonique unique du site : celle que déclare le sitemap. */
const urlOf = (lang, route) => `${SITE}${prefix(lang)}${route === '/' && prefix(lang) ? '' : route}`;

function titleOf(html) {
  return (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1].trim();
}
function descOf(html) {
  return (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].trim();
}

/**
 * Fil d'Ariane déduit de la route : /regle/madd → Accueil › Règles › Madd.
 * Il donne au moteur la hiérarchie du site, que le graphe d'entité seul n'exprime pas.
 */
function breadcrumbFor(lang, route, title) {
  const home = { name: 'Tilmidh', item: `${SITE}${prefix(lang) || '/'}` };
  if (route === '/') return null;
  const seg = route.replace(/^\//, '').split('/');
  const items = [home];
  if (seg.length > 1) {
    // Le dossier /regle n'est PAS une page : le hub réel est /regles-de-tajwid.
    // Et il n'existe pas dans toutes les langues — on ne met le maillon que si
    // le fichier est là, sinon le fil d'Ariane enverrait vers une 404.
    const HUBS = {
      regle: { slug: 'regles-de-tajwid', name: 'Règles de tajwid' },
      sourate: { slug: 'sourates', name: 'Sourates' },
    };
    const hub = HUBS[seg[0]];
    if (hub) {
      const hubFile = path.join(PUBLIC, prefix(lang).slice(1), `${hub.slug}.html`);
      if (existsSync(hubFile)) {
        items.push({ name: hub.name, item: `${SITE}${prefix(lang)}/${hub.slug}` });
      }
    }
  }
  items.push({ name: title.split('—')[0].split('|')[0].trim() || route, item: `${SITE}${prefix(lang)}${route}` });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };
}

function entityGraph({ lang, route, title, description }) {
  const crumb = breadcrumbFor(lang, route, title);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Tilmidh',
        alternateName: 'تلميذ',
        url: `${SITE}/`,
        logo: `${SITE}/icons/icon.svg`,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Tilmidh',
        alternateName: 'تلميذ',
        inLanguage: LANGS,
        publisher: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': `${urlOf(lang, route)}#page`,
        url: urlOf(lang, route),
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { '@id': `${SITE}/#website` },
      },
      ...(crumb ? [crumb] : []),
    ],
  });
}

const files = await walk(PUBLIC);
const stats = { graph: 0, crumb: 0, canonical: 0, robots: 0, untouched: 0 };

for (const rel of files) {
  const file = path.join(PUBLIC, rel);
  let html = await readFile(file, 'utf8');
  const before = html;
  const { lang, route } = parse(rel);
  const want = urlOf(lang, route);
  const changes = [];

  // 1. canonical aligné sur la forme du sitemap
  const canon = html.match(/<link rel="canonical" href="([^"]*)"\s*\/?>/);
  if (canon && canon[1] !== want) {
    html = html.replace(canon[0], `<link rel="canonical" href="${want}">`);
    changes.push(`canonical ${canon[1]} → ${want}`);
    stats.canonical++;
  }

  // 2. meta robots explicite si absente
  if (!/<meta name="robots"/i.test(html)) {
    const anchor = html.match(/[ \t]*<link rel="canonical"[^>]*>\n/);
    if (anchor) {
      html = html.replace(
        anchor[0],
        `    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">\n${anchor[0]}`
      );
      changes.push('meta robots');
      stats.robots++;
    }
  }

  // 3. graphe d'entité si la page n'a AUCUN JSON-LD
  if (!/application\/ld\+json/i.test(html)) {
    const graph = entityGraph({ lang, route, title: titleOf(html), description: descOf(html) });
    const anchor = html.match(/[ \t]*<\/head>/);
    if (anchor) {
      html = html.replace(
        anchor[0],
        `    <script type="application/ld+json">${graph}</script>\n${anchor[0]}`
      );
      changes.push('graphe Organization+WebSite+WebPage+BreadcrumbList');
      stats.graph++;
    }
  } else if (!/BreadcrumbList/.test(html)) {
    // La page a déjà un graphe mais pas de fil d'Ariane : on l'ajoute à part.
    const crumb = breadcrumbFor(lang, route, titleOf(html));
    const anchor = html.match(/[ \t]*<\/head>/);
    if (crumb && anchor) {
      const block = JSON.stringify({ '@context': 'https://schema.org', ...crumb });
      html = html.replace(
        anchor[0],
        `    <script type="application/ld+json">${block}</script>\n${anchor[0]}`
      );
      changes.push('BreadcrumbList');
      stats.crumb++;
    }
  }

  if (html === before) {
    stats.untouched++;
    continue;
  }
  console.log(`  ${rel}`);
  for (const c of changes) console.log(`      ${c}`);
  if (!DRY) await writeFile(file, html, 'utf8');
}

console.log(
  `\n${DRY ? '[simulation] ' : ''}graphe : ${stats.graph} · fil d'Ariane : ${stats.crumb} · canonical aligné : ${stats.canonical} · meta robots : ${stats.robots} · inchangées : ${stats.untouched}`
);
