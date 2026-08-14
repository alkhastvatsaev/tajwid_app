#!/usr/bin/env node
// Ajoute tr/ur/bn/ms/de/es à data/og-cards.json + repositionne home (apprendre à lire le Coran).
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'og-cards.json');

const NEW = ['tr', 'ur', 'bn', 'ms', 'de', 'es'];

const EXT = {
  home: {
    titles: {
      fr: 'Apprendre à lire le Coran',
      en: 'Learn to read the Quran',
      id: 'Belajar baca Al-Quran',
      ar: 'تعلم قراءة القرآن',
      ru: 'Научиться читать Коран',
      tr: 'Kuran okumayı öğren',
      ur: 'قرآن پڑھنا سیکھیں',
      bn: 'কুরআন পড়া শেখা',
      ms: 'Belajar baca Quran',
      de: 'Koran lesen lernen',
      es: 'Aprender a leer el Corán',
    },
    alts: {
      fr: 'Tilmidh — apprendre à lire le Coran mot à mot',
      en: 'Tilmidh — learn to read the Quran word by word',
      id: 'Tilmidh — belajar baca Al-Quran kata demi kata',
      ar: 'تلميذ — تعلم قراءة القرآن',
      ru: 'Tilmidh — читать Коран слово за слово',
      tr: 'Tilmidh — Kuran okumayı kelime kelime öğren',
      ur: 'Tilmidh — قرآن لفظ بہ لفظ پڑھنا سیکھیں',
      bn: 'Tilmidh — কুরআন শব্দে শব্দে পড়া শেখুন',
      ms: 'Tilmidh — belajar baca Quran perkata demi perkataan',
      de: 'Tilmidh — Koran Wort für Wort lesen lernen',
      es: 'Tilmidh — leer el Corán palabra por palabra',
    },
    slugs: {
      tr: 'tilmidh', ur: 'tilmidh', bn: 'tilmidh', ms: 'tilmidh', de: 'tilmidh', es: 'tilmidh',
    },
  },
  fatihah: {
    titles: {
      tr: 'Fatiha okumayı öğren',
      ur: 'سورة فاتحہ پڑھنا سیکھیں',
      bn: 'আল-ফাতিহা পড়া শেখুন',
      ms: 'Belajar baca Al-Fatihah',
      de: 'Al-Fatiha lesen lernen',
      es: 'Aprender Al-Fatiha',
    },
    alts: {
      tr: 'Fatiha — kelime kelime Tilmidh',
      ur: 'سورة فاتحہ — تلميذ',
      bn: 'আল-ফাতিহা — Tilmidh',
      ms: 'Al-Fatihah — latihan Tilmidh',
      de: 'Al-Fatiha — Tilmidh Übung',
      es: 'Al-Fatiha — práctica Tilmidh',
    },
    slugs: {
      tr: 'fatiha-ogren', ur: 'surah-fatiha', bn: 'al-fatihah', ms: 'al-fatihah', de: 'al-fatiha', es: 'al-fatiha',
    },
  },
  kursi: {
    titles: { tr: 'Ayetel Kürsi', ur: 'آیت الکرسی' },
    alts: { tr: 'Ayetel Kürsi — Tilmidh', ur: 'آیت الکرسی — تلميذ' },
    slugs: { tr: 'ayetel-kursi', ur: 'ayat-kursi' },
  },
  mulk: {
    titles: { tr: 'Sure Mulk', ur: 'سورہ الملک' },
    alts: { tr: 'Sure Mulk — Tilmidh', ur: 'سورہ الملک — تلميذ' },
    slugs: { tr: 'sure-mulk', ur: 'surah-mulk' },
  },
};

const data = JSON.parse(await readFile(FILE, 'utf8'));

for (const [cardId, fields] of Object.entries(EXT)) {
  const card = data.cards[cardId];
  if (!card) continue;
  for (const kind of ['titles', 'alts', 'slugs']) {
    if (!fields[kind]) continue;
    card[kind] = { ...card[kind], ...fields[kind] };
  }
}

// Fallback en pour les autres cartes (pages FR/EN/ID/AR/RU seulement)
for (const [cardId, card] of Object.entries(data.cards)) {
  for (const lang of NEW) {
    if (!card.titles[lang]) card.titles[lang] = card.titles.en;
    if (!card.alts[lang]) card.alts[lang] = card.alts.en;
    if (!card.slugs[lang]) card.slugs[lang] = card.slugs.en || cardId;
  }
}

await writeFile(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('og-cards.json étendu → 11 langues');
