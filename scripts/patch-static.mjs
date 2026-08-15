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
import {
  SITE,
  LANGS,
  prefix,
  AUTHOR,
  CONTACT,
  sourcesFor,
  renderByline,
  renderPageMeta,
  META_CSS,
} from './lib/template.mjs';

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

/** Les mêmes nœuds d'attribution que le générateur, à l'identique. */
const authorNode = () => ({
  '@type': 'Person',
  '@id': AUTHOR.id,
  name: AUTHOR.name,
  url: `${SITE}/`,
});

const contactPoints = () =>
  CONTACT.map((c) => ({
    '@type': 'ContactPoint',
    contactType: 'customer support',
    ...(c.kind === 'email' ? { email: c.value } : { url: c.href, name: c.kind }),
    availableLanguage: LANGS,
  }));

const citations = (lang) =>
  sourcesFor(lang).map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url }));

function entityGraph({ lang, route, title, description, withCrumb = true }) {
  const crumb = withCrumb ? breadcrumbFor(lang, route, title) : null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      authorNode(),
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Tilmidh',
        alternateName: 'تلميذ',
        url: `${SITE}/`,
        logo: `${SITE}/icons/icon.svg`,
        founder: { '@id': AUTHOR.id },
        contactPoint: contactPoints(),
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
        author: { '@id': AUTHOR.id },
        publisher: { '@id': `${SITE}/#organization` },
        citation: citations(lang),
      },
      ...(crumb ? [crumb] : []),
    ],
  });
}

const files = await walk(PUBLIC);
const stats = {
  graph: 0,
  crumb: 0,
  canonical: 0,
  robots: 0,
  author: 0,
  byline: 0,
  meta: 0,
  untouched: 0,
};

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
  } else if (!html.includes(`${SITE}/#organization`)) {
    // La page a un JSON-LD à elle (index.html a son WebApplication) mais aucun
    // rattachement à la marque. On n'y touche pas : on POSE le graphe d'entité
    // dans un second bloc. Plusieurs blocs ld+json sur une page sont valides et
    // fusionnés par @id — c'est la façon non destructive d'ajouter l'auteur.
    // Si un fil d'Ariane a déjà été posé lors d'un passage précédent, le
    // graphe ajouté ici NE doit pas en remettre un : deux BreadcrumbList sur
    // une même page, c'est un balisage contradictoire, pas un balisage double.
    const graph = entityGraph({
      lang,
      route,
      title: titleOf(html),
      description: descOf(html),
      withCrumb: !/BreadcrumbList/.test(html),
    });
    const anchor = html.match(/[ \t]*<\/head>/);
    if (anchor) {
      html = html.replace(
        anchor[0],
        `    <script type="application/ld+json">${graph}</script>\n${anchor[0]}`
      );
      changes.push('graphe d’entité en second bloc (JSON-LD existant préservé)');
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

  // 4. attribution dans un graphe DÉJÀ posé par ce script.
  // On ne réécrit que nos propres graphes — reconnaissables à l'@id
  // #organization — et seulement s'ils n'ont pas encore d'auteur. Un JSON-LD
  // écrit à la main ailleurs (FAQPage, HowTo) n'est jamais touché.
  if (!html.includes(AUTHOR.id)) {
    const own = html.match(
      new RegExp(`<script type="application/ld\\+json">(\\{[^<]*?${SITE.replace(/[.\\/]/g, '\\$&')}/#organization[^<]*?\\})</script>`)
    );
    if (own) {
      try {
        const data = JSON.parse(own[1]);
        const graph = data['@graph'] || [];
        const org = graph.find((n) => n['@type'] === 'Organization');
        const page = graph.find((n) => n['@type'] === 'WebPage');
        if (org && page) {
          graph.unshift(authorNode());
          org.founder = { '@id': AUTHOR.id };
          org.contactPoint = contactPoints();
          page.author = { '@id': AUTHOR.id };
          page.publisher = { '@id': `${SITE}/#organization` };
          page.citation = citations(lang);
          html = html.replace(
            own[0],
            `<script type="application/ld+json">${JSON.stringify(data)}</script>`
          );
          changes.push('author + contactPoint + citation');
          stats.author++;
        }
      } catch {
        // JSON illisible : on laisse la page intacte plutôt que de la casser.
      }
    }
  }

  // 5. signature visible sous le H1
  if (!/<p class="byline">/.test(html)) {
    const anchor = html.match(/[ \t]*<h1[^>]*>[\s\S]*?<\/h1>\n/);
    if (anchor) {
      html = html.replace(anchor[0], `${anchor[0]}${renderByline(lang, null)}\n`);
      changes.push('signature');
      stats.byline++;
    }
  }

  // 6. bloc sources + contact avant la mention légale.
  // Les pages de contenu ont un <footer> nu qui porte la mention légale : le
  // bloc se pose juste avant. index.html n'a pas cette forme — son footer SEO
  // est balisé et contient déjà le H1 ; là, le bloc se pose à la FIN du footer,
  // sinon il atterrirait au milieu de l'interface de l'app.
  if (!/<section class="page-meta">/.test(html)) {
    const plain = html.match(/[ \t]*<footer>\n/);
    const closing = html.match(/[ \t]*<\/footer>/);
    if (plain) {
      html = html.replace(plain[0], `${renderPageMeta(lang)}\n${plain[0]}`);
      changes.push('sources + contact');
      stats.meta++;
    } else if (closing) {
      html = html.replace(closing[0], `${renderPageMeta(lang)}\n${closing[0]}`);
      changes.push('sources + contact (fin de footer)');
      stats.meta++;
    }
  }

  // 7. styles des blocs ajoutés, si la feuille de la page ne les a pas
  if (/<section class="page-meta">/.test(html) && !/\.page-meta \{/.test(html)) {
    const anchor = html.match(/[ \t]*<\/style>/);
    if (anchor) {
      html = html.replace(anchor[0], `${META_CSS}\n${anchor[0]}`);
      changes.push('styles');
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
  `\n${DRY ? '[simulation] ' : ''}graphe : ${stats.graph} · fil d'Ariane : ${stats.crumb} · canonical aligné : ${stats.canonical} · meta robots : ${stats.robots} · attribution : ${stats.author} · signature : ${stats.byline} · sources+contact : ${stats.meta} · inchangées : ${stats.untouched}`
);
