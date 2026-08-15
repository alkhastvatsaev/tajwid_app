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

// Auteur des pages. Une personne nommée, pas une marque anonyme : c'est le
// signal que cherchent les moteurs de réponse avant de citer une page.
export const AUTHOR = {
  name: 'Alkhast Vatsaev',
  id: `${SITE}/#author`,
};

// Coordonnées publiques, à UN seul endroit : en retirer une = supprimer une
// ligne ici, puis relancer `npm run build:seo`. Un numéro publié sur 60 pages
// indexées est scrapé et ne se retire plus des caches — d'où le point unique.
export const CONTACT = [
  { kind: 'email', value: 'alkhastvatsaev@gmail.com', href: 'mailto:alkhastvatsaev@gmail.com' },
  { kind: 'whatsapp', value: '+33 7 67 69 38 04', href: 'https://wa.me/33767693804' },
  { kind: 'telegram', value: '@alkhastvatsaev', href: 'https://t.me/alkhastvatsaev' },
];

// Sources réellement utilisées par le produit. Rien d'autre n'entre ici :
// une source déclarée mais non utilisée est une fausse citation, et une
// fausse citation est exactement ce que les moteurs de réponse filtrent.
// Le nom reste un nom propre dans toutes les langues ; seule la précision
// qui le suit est traduite. Un libellé français sur une page russe est un
// signal de négligence, pas une citation.
export const SOURCES = [
  { key: 'quran', name: 'Quran.com', url: 'https://quran.com' },
  {
    key: 'font',
    name: 'King Fahd Glorious Quran Printing Complex',
    url: 'https://fonts.qurancomplex.gov.sa',
  },
  {
    key: 'speech',
    name: 'W3C Web Speech API',
    url: 'https://developer.mozilla.org/docs/Web/API/Web_Speech_API',
  },
];

const SOURCE_NOTES = {
  fr: { quran: 'texte Uthmani tajweed, riwāya Ḥafṣ ʿan ʿĀṣim', font: 'police KFGQPC HAFS', speech: 'reconnaissance vocale ar-SA, exécutée sur l’appareil' },
  en: { quran: 'Uthmani tajweed text, riwāya Ḥafṣ ʿan ʿĀṣim', font: 'KFGQPC HAFS typeface', speech: 'on-device ar-SA speech recognition' },
  id: { quran: 'teks Uthmani tajwid, riwayat Hafs dari Asim', font: 'font KFGQPC HAFS', speech: 'pengenalan suara ar-SA, berjalan di perangkat' },
  ar: { quran: 'النصّ العثماني الملوّن، برواية حفص عن عاصم', font: 'خطّ KFGQPC HAFS', speech: 'التعرّف على الصوت ar-SA، يعمل على الجهاز' },
  ru: { quran: 'текст усмани с таджвидом, риваят Хафса от Асима', font: 'шрифт KFGQPC HAFS', speech: 'распознавание речи ar-SA, на устройстве' },
  tr: { quran: 'Osmanî tecvid metni, Hafs an Âsım rivayeti', font: 'KFGQPC HAFS yazı tipi', speech: 'cihaz üzerinde ar-SA ses tanıma' },
  ur: { quran: 'عثمانی تجوید متن، روایت حفص عن عاصم', font: 'KFGQPC HAFS فونٹ', speech: 'ar-SA آواز کی شناخت، آلے پر' },
  bn: { quran: 'উসমানি তাজবিদ পাঠ, হাফস আন আসিম রেওয়ায়েত', font: 'KFGQPC HAFS ফন্ট', speech: 'ডিভাইসে ar-SA কণ্ঠস্বর শনাক্তকরণ' },
  ms: { quran: 'teks Uthmani tajwid, riwayat Hafs daripada Asim', font: 'fon KFGQPC HAFS', speech: 'pengecaman suara ar-SA, pada peranti' },
  de: { quran: 'Uthmani-Tadschwid-Text, Riwāya Ḥafṣ ʿan ʿĀṣim', font: 'Schriftart KFGQPC HAFS', speech: 'Spracherkennung ar-SA, auf dem Gerät' },
  es: { quran: 'texto uthmani con tajwid, riwāya Ḥafṣ ʿan ʿĀṣim', font: 'tipografía KFGQPC HAFS', speech: 'reconocimiento de voz ar-SA, en el dispositivo' },
};

/** Sources localisées : nom propre + précision traduite. */
export const sourcesFor = (lang) => {
  const notes = SOURCE_NOTES[lang] || SOURCE_NOTES.en;
  return SOURCES.map((s) => ({ ...s, label: `${s.name} — ${notes[s.key]}` }));
};

// Libellés traduits des blocs d'attribution. Anglais en repli.
const META_LABELS = {
  fr: { by: 'Écrit par', sources: 'Sources', contact: 'Contact', faq: 'Questions fréquentes', updated: 'Mis à jour le' },
  en: { by: 'Written by', sources: 'Sources', contact: 'Contact', faq: 'Frequently asked questions', updated: 'Updated' },
  id: { by: 'Ditulis oleh', sources: 'Sumber', contact: 'Kontak', faq: 'Pertanyaan yang sering diajukan', updated: 'Diperbarui' },
  ar: { by: 'بقلم', sources: 'المصادر', contact: 'التواصل', faq: 'أسئلة شائعة', updated: 'آخر تحديث' },
  ru: { by: 'Автор', sources: 'Источники', contact: 'Контакты', faq: 'Частые вопросы', updated: 'Обновлено' },
  tr: { by: 'Yazan', sources: 'Kaynaklar', contact: 'İletişim', faq: 'Sıkça sorulan sorular', updated: 'Güncellendi' },
  ur: { by: 'تحریر', sources: 'مآخذ', contact: 'رابطہ', faq: 'عام سوالات', updated: 'تازہ کاری' },
  bn: { by: 'লিখেছেন', sources: 'সূত্র', contact: 'যোগাযোগ', faq: 'সাধারণ প্রশ্ন', updated: 'হালনাগাদ' },
  ms: { by: 'Ditulis oleh', sources: 'Sumber', contact: 'Hubungi', faq: 'Soalan lazim', updated: 'Dikemas kini' },
  de: { by: 'Geschrieben von', sources: 'Quellen', contact: 'Kontakt', faq: 'Häufige Fragen', updated: 'Aktualisiert' },
  es: { by: 'Escrito por', sources: 'Fuentes', contact: 'Contacto', faq: 'Preguntas frecuentes', updated: 'Actualizado' },
};

export const metaLabels = (lang) => META_LABELS[lang] || META_LABELS.en;

// Styles de la signature, de la FAQ et du bloc sources/contact. Exporté pour
// que patch-static.mjs pose exactement les mêmes règles sur les pages
// écrites à la main : un seul endroit, deux familles de pages.
export const META_CSS = `        h3 { font-size: 1rem; line-height: 1.35; margin: 1.4rem 0 0.4rem; }
        .byline { font-size: 0.85rem; color: var(--muted); margin: -0.4rem 0 1.2rem; }
        .byline-name { color: var(--text); font-weight: 600; }
        .page-meta { font-size: 0.85rem; color: var(--muted); margin-top: 2.5rem; }
        .page-meta h2 { font-size: 0.9rem; margin: 1.4rem 0 0.4rem; }
        .page-meta ul { margin: 0; padding-inline-start: 1.1rem; }
        .page-meta a { color: var(--muted); }`;

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

function jsonLd({ lang, path, title, description, dateModified, breadcrumb, faq }) {
  const graph = [
    // L'auteur nommé. Une page non attribuée n'est presque jamais citée par un
    // moteur de réponse : il n'a personne à créditer.
    {
      '@type': 'Person',
      '@id': AUTHOR.id,
      name: AUTHOR.name,
      url: `${SITE}/`,
    },
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
      founder: { '@id': AUTHOR.id },
      contactPoint: CONTACT.map((c) => ({
        '@type': 'ContactPoint',
        contactType: 'customer support',
        ...(c.kind === 'email' ? { email: c.value } : { url: c.href, name: c.kind }),
        availableLanguage: LANGS,
      })),
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
      author: { '@id': AUTHOR.id },
      publisher: { '@id': `${SITE}/#organization` },
      // Les sources déclarées ici sont celles réellement utilisées par le
      // produit, et elles sont visibles sur la page. Un `citation` que le
      // lecteur ne peut pas vérifier dans le corps est du schema-spam.
      citation: sourcesFor(lang).map((s) => ({
        '@type': 'CreativeWork',
        name: s.label,
        url: s.url,
      })),
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
  // FAQPage : uniquement si les questions sont RÉELLEMENT rendues dans le
  // corps de la page. Un FAQPage sans FAQ visible se fait filtrer.
  if (faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${urlFor(lang, path)}#faq`,
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) },
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

const stripTags = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Signature visible, sous le H1. Le pendant lisible du `author` du JSON-LD. */
export function renderByline(lang, dateModified) {
  const t = metaLabels(lang);
  const date = dateModified ? ` · ${esc(t.updated)} ${esc(dateModified)}` : '';
  return `        <p class="byline">${esc(t.by)} <span class="byline-name">${esc(AUTHOR.name)}</span>${date}</p>`;
}

/**
 * Bloc FAQ visible. Chaque question est un H3 : c'est le format que les
 * moteurs de réponse extraient le plus fiablement.
 */
export function renderFaq(lang, faq) {
  if (!faq?.length) return '';
  const t = metaLabels(lang);
  const items = faq
    .map((f) => `            <h3>${f.q}</h3>\n            <p>${f.a}</p>`)
    .join('\n');
  return `        <section class="faq">
            <h2>${esc(t.faq)}</h2>
${items}
        </section>`;
}

/** Sources + contact, juste avant la mention légale. */
export function renderPageMeta(lang) {
  const t = metaLabels(lang);
  const sources = sourcesFor(lang).map(
    (s) => `                <li><a href="${s.url}" rel="nofollow noopener">${esc(s.label)}</a></li>`
  ).join('\n');
  const contact = CONTACT.map(
    (c) => `                <li><a href="${c.href}" rel="nofollow noopener">${esc(c.value)}</a></li>`
  ).join('\n');
  return `        <section class="page-meta">
            <h2>${esc(t.sources)}</h2>
            <ul>
${sources}
            </ul>
            <h2>${esc(t.contact)}</h2>
            <ul>
${contact}
            </ul>
        </section>`;
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
${META_CSS}
${ILLU_CSS}
    </style>
</head>
<body>
    <header><a href="${prefix(p.lang)}/">Tilmidh تلميذ</a></header>
    <main>
    <ol class="page-root copy-sidebar" role="presentation">
      <li>
        <h1>${esc(p.h1)}</h1>
${renderByline(p.lang, p.dateModified)}
${heroHtml}
${illuHtml}
${p.body}
${renderFaq(p.lang, p.faq)}
        <nav>
${navHtml}
        </nav>
${renderPageMeta(p.lang)}
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

/**
 * Compte les mots réellement lisibles : hors balises, hors arabe décoratif.
 * La signature et le bloc sources/contact sont identiques sur toutes les pages :
 * les compter relâcherait le seuil anti-page-mince d'une quarantaine de mots
 * gratuits. Ils sont donc retirés avant comptage.
 */
export function usefulWordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<section class="page-meta">[\s\S]*?<\/section>/gi, ' ')
    .replace(/<p class="byline">[\s\S]*?<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ');
  return text.split(/\s+/).filter((w) => w.length > 1).length;
}
