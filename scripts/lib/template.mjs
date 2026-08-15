// Gabarit unique des pages statiques Tilmidh.
// Toutes les pages générées passent par ici : un défaut se corrige à un seul endroit.

import { readFileSync } from 'node:fs';
import { ILLU_CSS, renderIlluBlock, illuIdForRoute, getCaption, ILLU_SCRIPTS } from './illustrations.mjs';

const OG_CARDS = JSON.parse(
  readFileSync(new URL('../../data/og-cards.json', import.meta.url), 'utf8')
).cards;

export const SITE = 'https://tilmidh.app';
export const LANGS = ['fr', 'en', 'id', 'ar', 'ru', 'tr', 'ur', 'bn', 'ms', 'de', 'es'];

// Préfixe d'URL par langue : le français est à la racine.
export const prefix = (lang) => (lang === 'fr' ? '' : `/${lang}`);

// Une seule forme d'URL sur tout le site : jamais de slash final, sauf la racine.
export const urlFor = (lang, path) =>
  `${SITE}${prefix(lang)}${path === '/' && prefix(lang) ? '' : path}`;

const RTL = new Set(['ar', 'ur']);

export function cardIdForRoute(route) {
  const r = route.replace(/\/$/, '') || '/';
  if (r === '/') return 'home';
  if (r.includes('ayat-kursi')) return 'kursi';
  if (r.includes('sourate/112')) return 'ikhlas';
  if (r.includes('sourate/113')) return 'falaq';
  if (r.includes('sourate/114')) return 'nas';
  if (r.includes('sourate/67')) return 'mulk';
  if (r.includes('sourate/1')) return 'fatihah';
  if (r.includes('regle/qalqalah')) return 'qalqalah';
  if (r.includes('regle/madd')) return 'madd';
  if (r.includes('regle/ghunnah')) return 'ghunnah';
  if (r.includes('regle/ikhfa')) return 'ikhfa';
  if (r.includes('regle/idgham')) return 'idgham';
  if (r.includes('tajwid-microphone')) return 'mic';
  if (r.includes('apprendre-tajwid')) return 'tajwid';
  if (r.includes('regles-de-tajwid')) return 'rules-hub';
  if (r.includes('coran-phonetique')) return 'phonetic';
  if (r.includes('best-tajwid-app-for-beginners')) return 'pemula';
  if (r.includes('meilleure-app-apprendre-lire-coran')) return 'lire-coran';
  if (r === '/sourates') return 'phonetic';
  if (r.includes('prilozhenie-tadzhvida')) return 'pemula';
  if (r.includes('privacy')) return 'privacy';
  return 'home';
}

export function heroFor(lang, route) {
  const cardId = cardIdForRoute(route);
  const card = OG_CARDS[cardId] || OG_CARDS.home;
  const slug = card.slugs[lang] || card.slugs.en || cardId;
  return {
    slug,
    pageUrl: `/img/page/${lang}/${slug}.webp`,
    ogUrl: `${SITE}/img/og/${lang}/${slug}.png`,
    alt: card.alts[lang] || card.alts.en,
  };
}

export function renderHeroBlock(lang, route, altOverride) {
  const hero = heroFor(lang, route);
  const alt = esc(altOverride || hero.alt);
  return `        <figure class="hero-img">
            <img src="${hero.pageUrl}" alt="${alt}" width="960" height="540" fetchpriority="high" decoding="async">
        </figure>`;
}

// Profils externes de la marque, pour le sameAs de l'Organization.
// N'ajouter ici qu'une URL qui EXISTE réellement : un sameAs vers un profil
// inexistant est un signal mort, pas un signal neutre. La fiche Play viendra ici.
export const EXTERNAL_PROFILES = [];

const esc = (s) =>
  String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Bloc hreflang réciproque. On ne déclare que les langues réellement présentes
 * pour cette page — déclarer une variante qui n'existe pas casse tout le groupe.
 */
function hreflangBlock(path, availableLangs) {
  const rows = availableLangs.map(
    (l) => `    <link rel="alternate" hreflang="${l}" href="${urlFor(l, path)}">`
  );
  rows.push(`    <link rel="alternate" hreflang="x-default" href="${availableLangs.includes('id') ? urlFor('id', path) : `${SITE}/id`}">`);
  return rows.join('\n');
}

function jsonLd({ lang, path, title, description, dateModified, breadcrumb }) {
  const graph = [
    // Graphe d'entité : posé sur CHAQUE page, c'est ce qui permet à un moteur
    // de rattacher toutes les pages à une même marque. Le sameAs doit pointer
    // vers des profils EXTERNES — auto-référencé, il n'apporte rien.
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Tilmidh',
      alternateName: 'تلميذ',
      url: `${SITE}/`,
      logo: `${SITE}/icons/icon.svg`,
      sameAs: EXTERNAL_PROFILES,
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
      '@id': `${urlFor(lang, path)}#page`,
      url: urlFor(lang, path),
      name: title,
      description,
      inLanguage: lang,
      isPartOf: { '@id': `${SITE}/#website` },
      dateModified,
    },
  ];
  if (breadcrumb?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: `${SITE}${b.item}`,
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/**
 * @param {object} p
 * @param {string} p.lang        code langue
 * @param {string} p.path        chemin sans préfixe de langue, ex. "/regle/qalqalah"
 * @param {string[]} p.available langues où cette page existe
 * @param {string} p.title
 * @param {string} p.description
 * @param {string} p.h1
 * @param {string} p.body        HTML du corps (paragraphes, arabe, CTA)
 * @param {{href:string,label:string}[]} p.nav
 * @param {string} p.footer      mention légale traduite
 * @param {string} p.dateModified  ISO court
 * @param {{name:string,item:string}[]} [p.breadcrumb]
 * @param {string} [p.illuId]
 * @param {string} [p.illuCaption]
 * @param {string} [p.ogSlug]
 */
export function renderPage(p) {
  const dir = RTL.has(p.lang) ? ' dir="rtl"' : '';
  const canonical = urlFor(p.lang, p.path);
  const navHtml = p.nav.map((n) => `            <a href="${n.href}">${esc(n.label)}</a>`).join('\n');
  const hero = heroFor(p.lang, p.path);
  const ogSlug = p.ogSlug || hero.slug;
  const ogAlt = esc(p.ogAlt || hero.alt);
  const ogImage = `${SITE}/img/og/${p.lang}/${ogSlug}.png`;
  const pageImage = `/img/page/${p.lang}/${ogSlug}.webp`;
  const illuId = p.illuId || illuIdForRoute(p.path);
  const illuCaption = p.illuCaption || getCaption(p.lang, illuId);
  const heroHtml = `        <figure class="hero-img">
            <img src="${pageImage}" alt="${ogAlt}" width="960" height="540" fetchpriority="high" decoding="async">
        </figure>`;
  const illuHtml = renderIlluBlock({ illuId, lang: p.lang, caption: illuCaption });

  return `<!DOCTYPE html>
<html lang="${p.lang}"${dir}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(p.title)}</title>
    <meta name="description" content="${esc(p.description)}">
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
    <link rel="canonical" href="${canonical}">
${hreflangBlock(p.path, p.available)}
    <meta name="theme-color" content="#059669">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${esc(p.title)}">
    <meta property="og:description" content="${esc(p.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${ogAlt}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${ogImage}">
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="preload" href="/fonts/KFGQPCHAFSColored-Bold.woff2?v=chromatic-2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/KFGQPCHAFSColored-Mono.woff2?v=2" as="font" type="font/woff2" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;600&display=swap" rel="stylesheet">
    <script type="application/ld+json">${jsonLd(p)}</script>
    <style>
        :root { --accent: #059669; --bg: #f7f7f5; --text: #111; --muted: #555; }
        body { margin: 0; font-family: Outfit, sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; }
        header { padding: 1.1rem 1.4rem; border-bottom: 2px solid var(--accent); background: #fff; }
        header a { color: var(--accent); text-decoration: none; font-weight: 600; }
        main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.4rem 4rem; }
        h1 { font-size: 1.7rem; line-height: 1.25; margin: 0 0 1rem; }
        h2 { font-size: 1.15rem; line-height: 1.3; margin: 2rem 0 0.6rem; }
        .ar { font-family: Amiri, serif; font-size: 1.65rem; direction: rtl; text-align: right; }
        .cta { display: inline-block; margin: 1.4rem 0; padding: 0.9rem 1.35rem; background: var(--accent); color: #fff; border-radius: 999px; text-decoration: none; font-weight: 600; }
        nav { display: flex; flex-wrap: wrap; gap: 0.7rem 1rem; margin: 2rem 0; }
        nav a { color: var(--accent); }
        footer { font-size: 0.85rem; color: var(--muted); border-top: 1px solid #ddd; padding-top: 1.4rem; margin-top: 2.5rem; }
        ol.page-root, ol.page-root > li { list-style: none; margin: 0; padding: 0; }
        .hero-img { margin: 0 0 1.4rem; border-radius: 12px; overflow: hidden; background: #51A26A; }
        .hero-img img { display: block; width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.95rem; }
        th, td { text-align: start; padding: 0.5rem 0.6rem; border-bottom: 1px solid #ddd; }
        th { color: var(--muted); font-weight: 600; }
${ILLU_CSS}
    </style>
</head>
<body>
    <header><a href="${prefix(p.lang)}/">Tilmidh تلميذ</a></header>
    <main>
    <ol class="page-root copy-sidebar" role="presentation">
      <li>
        <h1>${esc(p.h1)}</h1>
${heroHtml}
${illuHtml}
${p.body}
        <nav>
${navHtml}
        </nav>
        <footer>
            <p>${p.footer}</p>
        </footer>
      </li>
    </ol>
    </main>
${ILLU_SCRIPTS}
</body>
</html>
`;
}

/** Compte les mots réellement lisibles : hors balises, hors arabe décoratif. */
export function usefulWordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
  return text.split(/\s+/).filter((w) => w.length > 1).length;
}
