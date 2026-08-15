#!/usr/bin/env node
// Génère les pages statiques depuis data/*.json.
//
//   node scripts/gen-pages.mjs               → génère tout
//   node scripts/gen-pages.mjs --lang id     → une seule langue
//   node scripts/gen-pages.mjs --audit       → n'écrit rien, contrôle seulement
//   node scripts/gen-pages.mjs --min 400     → seuil de mots utiles (défaut 400)
//
// Garde-fou : une page sous le seuil de mots utiles n'est PAS écrite.
// C'est volontairement un refus, pas un avertissement — c'est ce qui empêche
// de reproduire à 570 exemplaires les pages à 97 mots déjà en ligne.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage, usefulWordCount, prefix, LANGS } from './lib/template.mjs';
import { illuIdForRoute, getCaption } from './lib/illustrations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const PUBLIC = path.join(ROOT, 'public');

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1] ?? true;
};
const AUDIT = args.includes('--audit');
const ONLY_LANG = flag('lang');
const MIN_WORDS = Number(flag('min', 400));

const stats = { written: 0, skipped: 0, rejected: [] };

async function loadCollection(name) {
  const file = path.join(DATA, `${name}.json`);
  if (!existsSync(file)) return [];
  return JSON.parse(await readFile(file, 'utf8'));
}

/**
 * Langues où la page existe réellement : celles décrites dans les données,
 * PLUS celles déjà présentes sur le disque (pages écrites à la main).
 * Sans ce second test, une page générée déclarerait un cluster hreflang
 * amputé alors que les autres langues, elles, pointent vers elle — et Google
 * ignore un groupe dont les liens ne se répondent pas.
 */
function availableLangs(entry, kind) {
  const fromData = Object.keys(entry.langs).filter((l) => entry.langs[l]?.body?.length);
  const onDisk = LANGS.filter((l) =>
    existsSync(
      kind
        ? path.join(PUBLIC, prefix(l).slice(1), kind, `${entry.slug}.html`)
        : entry.slug
          ? path.join(PUBLIC, prefix(l).slice(1), `${entry.slug}.html`)
          : path.join(PUBLIC, `${l}.html`)
    )
  );
  return LANGS.filter((l) => fromData.includes(l) || onDisk.includes(l));
}

async function buildEntry(entry, kind) {
  // `available` sert au bloc hreflang : il inclut les pages écrites à la main.
  // On n'ÉCRIT en revanche que les langues décrites dans les données.
  const available = availableLangs(entry, kind);
  const toWrite = Object.keys(entry.langs).filter((l) => entry.langs[l]?.body?.length);

  for (const lang of toWrite) {
    if (ONLY_LANG && lang !== ONLY_LANG) continue;
    const L = entry.langs[lang];
    // slug vide = page d'accueil de la langue (public/en.html → /en)
    const pagePath = kind ? `/${kind}/${entry.slug}` : entry.slug ? `/${entry.slug}` : '/';

    const bodyHtml = L.body.map((block) => renderBlock(block, lang, entry)).join('\n');
    const illuId = entry.illuId || illuIdForRoute(pagePath);

    const html = renderPage({
      lang,
      path: pagePath,
      available,
      title: L.title,
      description: L.description,
      h1: L.h1,
      body: bodyHtml,
      faq: L.faq,
      nav: (L.nav ?? []).map((n) => ({ ...n, href: `${prefix(lang)}${n.href}` })),
      footer: L.footer,
      dateModified: entry.dateModified ?? new Date().toISOString().slice(0, 10),
      breadcrumb: L.breadcrumb,
      illuId,
      illuCaption: L.illuCaption || getCaption(lang, illuId),
      ogSlug: L.ogSlug || entry.ogSlug,
      ogAlt: L.ogAlt || L.title,
    });

    const words = usefulWordCount(html);
    if (words < MIN_WORDS) {
      stats.rejected.push({ lang, path: pagePath, words });
      continue;
    }

    const outPath = kind
      ? path.join(PUBLIC, prefix(lang).slice(1), kind, `${entry.slug}.html`)
      : entry.slug
        ? path.join(PUBLIC, prefix(lang).slice(1), `${entry.slug}.html`)
        : path.join(PUBLIC, `${lang}.html`);
    if (AUDIT) {
      stats.skipped++;
      console.log(`  ok   ${lang.padEnd(2)} ${pagePath.padEnd(34)} ${words} mots`);
      continue;
    }
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, html, 'utf8');
    stats.written++;
    console.log(`  écrit ${lang.padEnd(2)} ${pagePath.padEnd(34)} ${words} mots`);
  }
}

/** Un bloc de contenu → HTML. Types volontairement peu nombreux. */
function renderBlock(block, lang, entry) {
  switch (block.t) {
    case 'p':
      return `        <p>${block.html}</p>`;
    case 'h2':
      return `        <h2>${block.html}</h2>`;
    case 'ar':
      return `        <p class="ar">${block.html}</p>`;
    case 'cta':
      return `        <a class="cta" href="${prefix(lang)}/?ref=${block.ref}">${block.label}</a>`;
    case 'table': {
      const head = `<tr>${block.head.map((h) => `<th>${h}</th>`).join('')}</tr>`;
      const rows = block.rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('');
      return `        <table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
    }
    default:
      throw new Error(`Type de bloc inconnu « ${block.t} » dans ${entry.slug}`);
  }
}

async function main() {
  console.log(AUDIT ? 'Contrôle (aucune écriture)' : 'Génération');
  console.log(`Seuil : ${MIN_WORDS} mots utiles\n`);

  for (const [name, kind] of [
    ['regles', 'regle'],
    ['sourates', 'sourate'],
    ['pages', null], // pages autonomes : le slug est la route, pas de dossier
  ]) {
    const entries = await loadCollection(name);
    if (!entries.length) continue;
    console.log(`${name} — ${entries.length} entrées`);
    for (const e of entries) await buildEntry(e, kind);
    console.log('');
  }

  if (stats.rejected.length) {
    console.log(`REFUSÉ — ${stats.rejected.length} page(s) sous ${MIN_WORDS} mots :`);
    for (const r of stats.rejected) {
      console.log(`  ${r.lang} ${r.path} — ${r.words} mots`);
    }
    console.log('\nÉtoffe le contenu ou retire l’entrée. Aucune page mince n’est publiée.');
  }

  console.log(`\n${stats.written} écrite(s), ${stats.rejected.length} refusée(s)`);
  if (stats.rejected.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
