#!/usr/bin/env node
// Génère ayat-kursi + sourate/67 pour bn, ms, de, es.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const HREFLANG = ['id', 'tr', 'ur', 'bn', 'ms', 'de', 'es'];
const hrefLines = (route) =>
  HREFLANG.map(
    (l) =>
      `    <link rel="alternate" hreflang="${l}" href="https://tilmidh.app/${l}${route}">`
  ).join('\n') +
  `\n    <link rel="alternate" hreflang="x-default" href="https://tilmidh.app/id${route}">`;

const CSS = `        :root { --accent: #51A26A; --bg: #f7f7f5; --text: #111; --muted: #555; }
        body { margin: 0; font-family: Outfit, sans-serif; background: var(--bg); color: var(--text); line-height: 1.75; }
        header { padding: 1.1rem 1.4rem; border-bottom: 2px solid var(--accent); background: #fff; }
        header a { color: var(--accent); text-decoration: none; font-weight: 600; }
        main { max-width: 42rem; margin: 0 auto; padding: 2rem 1.4rem 4rem; }
        h1 { font-size: 1.75rem; line-height: 1.25; margin: 0 0 1rem; }
        h2 { font-size: 1.15rem; margin: 2rem 0 0.75rem; }
        .ar { font-family: Amiri, serif; font-size: 1.45rem; direction: rtl; text-align: right; line-height: 2.1; }
        .cta { display: inline-block; margin: 1.4rem 0; padding: 0.95rem 1.4rem; background: var(--accent); color: #fff; border-radius: 999px; text-decoration: none; font-weight: 600; }
        nav { display: flex; flex-wrap: wrap; gap: 0.7rem 1rem; margin: 2rem 0; }
        nav a { color: var(--accent); }
        footer { font-size: 0.85rem; color: var(--muted); border-top: 1px solid #ddd; padding-top: 1.4rem; margin-top: 2.5rem; }`;

function page({ lang, dir, route, title, desc, ogTitle, ogDesc, ogLocale, h1, body, nav, footer, faq }) {
  const canonical = `https://tilmidh.app/${lang}${route}`;
  const ogSlug = route.includes('kursi') ? (lang === 'de' ? 'ayat-kursi' : lang === 'bn' ? 'ayat-kursi' : lang === 'ms' ? 'ayat-kursi' : lang === 'es' ? 'ayat-kursi' : 'ayat-kursi') : (lang === 'de' ? 'al-mulk' : lang === 'bn' ? 'al-mulk' : lang === 'ms' ? 'al-mulk' : lang === 'es' ? 'surah-mulk' : 'al-mulk');
  const card = route.includes('kursi') ? 'kursi' : 'mulk';
  const slugMap = {
    bn: { kursi: 'ayat-kursi', mulk: 'al-mulk' },
    ms: { kursi: 'ayat-kursi', mulk: 'al-mulk' },
    de: { kursi: 'ayat-kursi', mulk: 'al-mulk' },
    es: { kursi: 'ayat-kursi', mulk: 'surah-mulk' },
  };
  const slug = slugMap[lang][card];
  const ogImage = `https://tilmidh.app/img/og/${lang}/${slug}.png`;
  const pageImage = `/img/page/${lang}/${slug}.webp`;
  const ogAlt = ogTitle;

  return `<!DOCTYPE html>
<html lang="${lang}"${dir ? ` dir="${dir}"` : ''}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
    <link rel="canonical" href="${canonical}">
${hrefLines(route)}
    <meta name="theme-color" content="#51A26A">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:locale" content="${ogLocale}">
    <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
    <link rel="manifest" href="/manifest.webmanifest">
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;600&display=swap" rel="stylesheet">
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${canonical}#page`,
          url: canonical,
          name: ogTitle,
          description: desc,
          inLanguage: lang,
        },
        { '@type': 'FAQPage', mainEntity: faq },
      ],
    })}</script>
    <style>
${CSS}
    </style>
</head>
<body>
    <header><a href="/${lang}">Tilmidh تلميذ</a> · <a href="/${lang}/sourate/1">${nav.fatihahLabel}</a></header>
    <main>
        <h1>${h1}</h1>
${body}
        <nav>
${nav.links.map((l) => `            <a href="${l.href}">${l.label}</a>`).join('\n')}
        </nav>
        <footer>
            <p>${footer}</p>
        </footer>
    </main>
</body>
</html>
`;
}

const AR_START = `<p class="ar">ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ</p>`;
const AR_MULK = `<p class="ar">تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ</p>`;

const PAGES = [
  // BN kursi
  {
    lang: 'bn', route: '/ayat-kursi',
    title: 'আয়াতুল কুরসি শেখা — শব্দে শব্দে কুরআন | Tilmidh',
    desc: 'আয়াতুল কুরসি (বাকারা ২:২৫৫) শেখা: আরবি, উচ্চারণ, মাইক্রোফোন দিয়ে শব্দে শব্দে তিলাওয়াত। Tilmidh বিনামূল্যে — ইজাজত নয়।',
    ogTitle: 'আয়াতুল কুরসি শেখা — Tilmidh', ogDesc: 'আয়াতুল কুরসি: আরবি, উচ্চারণ, Tilmidh মাইক্রোফোন।', ogLocale: 'bn_BD',
    h1: 'আয়াতুল কুরসি শেখা — শব্দে শব্দে তিলাওয়াত',
    body: `<p><strong>আয়াতুল কুরসি</strong> (آية الكرسي) বাকারা সূরার ২৫৫ নম্বর আয়াত — ইসলামে সবচেয়ে বেশি পড়া ও হাফেজ করা আয়াতগুলোর একটি। দীর্ঘ, আল্লাহর গুণাবলিতে পূর্ণ, স্পষ্ট উচ্চারণ দরকার। বোঝার জন্য এই পৃষ্ঠা; <strong>শব্দে শব্দে অনুশীলন</strong> এর জন্য <a href="/bn">Tilmidh</a> ব্যবহার করুন।</p>
<h2>আয়াতুল কুরসি কী?</h2>
<p><em>al-kursī</em> (আল্লাহর কুরসি) উল্লেখের কারণে « আয়াতুল কুরসি » নাম। রাসূল ﷺ সুরক্ষার জন্য শিখিয়েছেন। অনেক মুসলমান নামাজের পর, ঘুমানোর আগে বা সকাল-সন্ধ্যায় পড়েন।</p>
<h2>আরবি পাঠ (আয়াতের শুরু)</h2>
${AR_START}
<p><em>Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm</em></p>
<p>অর্থ (সংক্ষেপে): « আল্লাহ — তিনি ছাড়া কোনো ইলাহ নেই; তিনি চিরঞ্জীব, সবকিছু পরিচালনাকারী। »</p>
<h2>শিক্ষানবিসদের জন্য তাজউইদ টিপ</h2>
<ul>
<li><strong>Madd</strong> — <em>l-ḥayy</em>, <em>l-qayyūm</em>-এ alif দীর্ঘ করুন।</li>
<li><strong>Ghunnah</strong> — শদ্দাযুক্ত nun ও mim-এ নাসিক ধ্বনি।</li>
<li><strong>Ikhfa / idgham</strong> — সুকুন nun-এর পরের হরফে খেয়াল।</li>
<li><strong>তাড়াহুড়ো করবেন না</strong> — দীর্ঘ আয়াত; অংশে অংশে শিখুন।</li>
</ul>
<h2>Tilmidh দিয়ে শেখা</h2>
<ol>
<li>প্রথমে <a href="/bn/sourate/1">আল-ফাতিহা</a> শব্দে শব্দে — মাইক্রোফোন, সবুজ বাক্স, তাজউইদ রং।</li>
<li>« এক শব্দ → যাচাই → এগিয়ে » রিটমে মুখ ও কান অভ্যস্ত করুন।</li>
<li>তারপর আয়াতুল কুরসি অংশে ভাগ করুন; মিলিয়ে পড়ার আগে প্রতিটি অংশ মসৃণ করুন।</li>
</ol>
<a class="cta" href="/?ref=1">শুরু করুন — Tilmidh-এ আল-ফাতিহা</a>
<h2>ফজিলত (সংক্ষেপে)</h2>
<p>হাদিসে বরকত ও সুরক্ষার জন্য পড়া হয়। অর্থ শিখুন, খুশু' দিয়ে পড়ুন — Tilmidh <em>উচ্চারণ</em> সাহায্য করে; তাফসির ও শিক্ষকের সাথে।</p>`,
    nav: { fatihahLabel: 'আল-ফাতিহা', links: [{ href: '/bn/sourate/1', label: 'ফাতিহা শেখা' }, { href: '/bn/sourate/67', label: 'সূরা আল-মুলক' }, { href: '/id/ayat-kursi', label: 'ID Ayat Kursi' }] },
    footer: 'Tilmidh — তিলাওয়াত অনুশীলন। ইজাজত নয়। Muqri\' দিয়ে যাচাই করুন।',
    faq: [
      { '@type': 'Question', name: 'আয়াতুল কুরসি কীভাবে শেখব?', acceptedAnswer: { '@type': 'Answer', text: 'শব্দে শব্দে ভিত্তি। Tilmidh (tilmidh.app) প্রথমে আল-ফাতিহা দিয়ে মাইক্রোফোন চালায় — একই পদ্ধতি দীর্ঘ আয়াতের জন্য: অংশে অংশে, ঠিক না হওয়া পর্যন্ত পুনরাবৃত্তি।' } },
      { '@type': 'Question', name: 'বিনামূল্যে কুরআন পড়ার অ্যাপ?', acceptedAnswer: { '@type': 'Answer', text: 'Tilmidh বিনামূল্যে ওয়েব অ্যাপ: আরবি মাইক্রোফোন, তাজউইদ রং, এক শব্দ। শিক্ষানবিসদের জন্য। ইজাজত নয়।' } },
    ],
  },
  // BN mulk
  {
    lang: 'bn', route: '/sourate/67',
    title: 'সূরা আল-মুলক শেখা — শব্দে শব্দে কুরআন | Tilmidh',
    desc: 'সূরা আল-মুলক (৬৭) শেখা: ফজিলত, আরবি পাঠ, Tilmidh দিয়ে শব্দে শব্দে তিলাওয়াত। বিনামূল্যে শিক্ষানবিস ও শিশুদের জন্য।',
    ogTitle: 'সূরা আল-মুলক শেখা — Tilmidh', ogDesc: 'আল-মুলক: মাইক্রোফোন দিয়ে শব্দে শব্দে শেখা।', ogLocale: 'bn_BD',
    h1: 'সূরা আল-মুলক শেখা — শব্দে শব্দে তিলাওয়াত',
    body: `<p><strong>সূরা আল-মুলক</strong> (المULK, « রাজত্ব ») — ৩০ আয়াত, ঘুমানোর আগে প্রায়ই পড়া হয়। অনেকেই « আল-মুলক শিখতে » চান কিন্তু দৈর্ঘ্যে ভয় পান। শিক্ষানবিস ও শিশুর গোপন: <strong>পুরো সূরা দিয়ে শুরু করবেন না</strong> — এক সঠিক শব্দ, তারপর যুক্ত করুন।</p>
<h2>আল-মুলকের ফজিলত</h2>
<p>রাসূল ﷺ ঘুমানোর আগে এই সূরা পড়তে শিখিয়েছেন। আল্লাহ সৃষ্টির উপর ক্ষমতা — tartil দিয়ে পড়া দ্রুত কিন্তু ভুল উচ্চারণের চেয়ে ভালো।</p>
<h2>আয়াত ১ — উদাহরণ</h2>
${AR_MULK}
<p><em>Tabārakal-ladzī biyadihil-mulku wa huwa ʿalā kulli syai'in qadīr</em></p>
<p>অর্থ: « মহান যিনি হাতে রাজত্ব, তিনি সবকিছুর উপর ক্ষমতাবান। » madd, ghunnah, idgham-এ খেয়াল রাখুন।</p>
<h2>Tilmidh পদ্ধতি</h2>
<ol>
<li>একটি আরবি শব্দ তাজউইদ রং সহ দেখুন।</li>
<li>উচ্চারণ করুন — মাইক্রোফোন যাচাই করে।</li>
<li>সবুজ বাক্স → এগিয়ে। ধূসর → শুধু সেই শব্দ পুনরাবৃত্তি।</li>
</ol>
<p>মূল অনুশীলন <a href="/bn/sourate/1">আল-ফাতিহায়</a> — নামাজের ভিত্তি। প্রথমে ফাতিহা; « ছোট অংশ, পুনরাবৃত্তি, যুক্ত » — Al-Mulk-এর জন্য একই দক্ষতা।</p>
<a class="cta" href="/?ref=1">শুরু — Tilmidh-এ আল-ফাতিহা</a>
<h2>শিশুদের জন্য</h2>
<p>তাৎক্ষণিক প্রতিক্রিয়া দীর্ঘ তিরস্কারের চেয়ে দ্রুত শেখায়। Tilmidh-এ সবুজ বাক্স = ভিজ্যুয়াল প্রশংসা।</p>
<h2>ইজাজত নয়</h2>
<p>Tilmidh <em>উচ্চারণ অনুশীলন</em> সাহায্য করে। সহীহ পাঠ ও সনদের জন্য muqri\' — Tilmidh শিক্ষকের বিকল্প নয়।</p>`,
    nav: { fatihahLabel: 'আল-ফাতিহা', links: [{ href: '/bn/sourate/1', label: 'ফাতিহা শেখা' }, { href: '/bn/ayat-kursi', label: 'আয়াতুল কুরসি' }, { href: '/id/sourate/67', label: 'ID Al-Mulk' }] },
    footer: 'Tilmidh — তিলাওয়াত অনুশীলন। Quran.com পাঠ। ইজাজত নয়।',
    faq: [
      { '@type': 'Question', name: 'আল-মুলক কীভাবে শিখব?', acceptedAnswer: { '@type': 'Answer', text: 'প্রথমে তিলাওয়াতের ভিত্তি। Tilmidh (tilmidh.app) আল-ফাতিহা শব্দে শব্দে মাইক্রোফোন দিয়ে — একই পদ্ধতি Al-Mulk-এ: অংশে ভাগ, ঠিক না হওয়া পর্যন্ত পুনরাবৃত্তি।' } },
      { '@type': 'Question', name: 'ঘুমানোর আগে Al-Mulk পড়ার ফজিলত?', acceptedAnswer: { '@type': 'Answer', text: 'হাদিসে ঘুমানোর আগে Al-Mulk পড়া সুরক্ষা দেয় বলা হয়েছে। সঠিক পাঠ শিক্ষকের সাথে; Tilmidh দৈনিক অনুশীলনে সাহায্য করে।' } },
    ],
  },
  // MS kursi
  {
    lang: 'ms', route: '/ayat-kursi',
    title: 'Belajar Ayat Kursi — baca Quran perkata demi perkataan | Tilmidh',
    desc: 'Belajar Ayat Kursi (Al-Baqarah 2:255): Arab, sebutan, latihan mikrofon perkata demi perkataan. Tilmidh percuma — bukan ijazah.',
    ogTitle: 'Belajar Ayat Kursi — Tilmidh', ogDesc: 'Ayat Kursi: Arab, sebutan, mikrofon Tilmidh.', ogLocale: 'ms_MY',
    h1: 'Belajar Ayat Kursi — tilawah perkata demi perkataan',
    body: `<p><strong>Ayat Kursi</strong> (آية الكرسي) ayat 255 Surah Al-Baqarah — antara ayat paling dibaca dan dihafal. Panjang, penuh sifat Allah, perlukan bacaan jelas. Halaman ini untuk <strong>memahami</strong>; untuk <strong>latihan perkata demi perkataan</strong>, guna <a href="/ms">Tilmidh</a>.</p>
<h2>Apa itu Ayat Kursi?</h2>
<p>Dinamakan kerana <em>al-kursī</em> (Arasy Allah). Rasulullah ﷺ ajar untuk perlindungan. Ramai Muslim baca selepas solat, sebelum tidur, atau pagi petang.</p>
<h2>Teks Arab (permulaan ayat)</h2>
${AR_START}
<p><em>Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm</em></p>
<p>Maksud (ringkas): « Allah — tiada tuhan melainkan Dia; Yang Hidup kekal, Yang mengurus makhluk-Nya. »</p>
<h2>Tips tajwid untuk pemula</h2>
<ul>
<li><strong>Madd</strong> — panjangkan alif dalam <em>l-ḥayy</em>, <em>l-qayyūm</em>.</li>
<li><strong>Ghunnah</strong> — dengung pada nun dan mim bertasydid.</li>
<li><strong>Ikhfa / idgham</strong> — perhatikan nun sukun.</li>
<li><strong>Jangan gesa</strong> — ayat panjang; latih per segmen.</li>
</ul>
<h2>Belajar dengan Tilmidh</h2>
<ol>
<li>Latih <a href="/ms/sourate/1">Al-Fatihah</a> perkata demi perkataan dulu.</li>
<li>Biasakan « satu perkata → semak → sambung ».</li>
<li>Kemudian pecah Ayat Kursi per frasa; ulang sebelum gabung.</li>
</ol>
<a class="cta" href="/?ref=1">Mula — Al-Fatihah di Tilmidh</a>
<h2>Keutamaan (ringkas)</h2>
<p>Dibaca untuk keberkatan dan perlindungan. Tilmidh bantu <em>sebutan</em>; makna dengan tafsir dan guru.</p>`,
    nav: { fatihahLabel: 'Al-Fatihah', links: [{ href: '/ms/sourate/1', label: 'Belajar Al-Fatihah' }, { href: '/ms/sourate/67', label: 'Surah Al-Mulk' }, { href: '/id/ayat-kursi', label: 'ID Ayat Kursi' }] },
    footer: 'Tilmidh — latihan tilawah. Bukan ijazah. Sahkan dengan muqriʾ.',
    faq: [
      { '@type': 'Question', name: 'Bagaimana belajar Ayat Kursi untuk pemula?', acceptedAnswer: { '@type': 'Answer', text: 'Asas perkata demi perkataan. Tilmidh (tilmidh.app) latih Al-Fatihah dulu dengan mikrofon — kaedah sama untuk ayat panjang: pecah, ulang, sambung.' } },
      { '@type': 'Question', name: 'Aplikasi percuma latihan baca Quran?', acceptedAnswer: { '@type': 'Answer', text: 'Tilmidh web percuma: mikrofon Arab, warna tajwid, satu perkata. Untuk pemula. Bukan ijazah.' } },
    ],
  },
  // MS mulk
  {
    lang: 'ms', route: '/sourate/67',
    title: 'Belajar Surah Al-Mulk — baca Quran perkata demi perkataan | Tilmidh',
    desc: 'Belajar Surah Al-Mulk (67): keutamaan, bacaan Arab, latihan tilawah dengan Tilmidh. Percuma untuk pemula dan kanak-kanak.',
    ogTitle: 'Belajar Surah Al-Mulk — Tilmidh', ogDesc: 'Al-Mulk: latihan mikrofon perkata demi perkataan.', ogLocale: 'ms_MY',
    h1: 'Belajar Surah Al-Mulk — tilawah perkata demi perkataan',
    body: `<p><strong>Surah Al-Mulk</strong> (الملك) — 30 ayat, sering dibaca sebelum tidur. Ramai mahu « belajar Al-Mulk » tapi takut panjang. Rahsia pemula: <strong>jangan mula seluruh surah</strong> — satu perkata betul, kemudian sambung.</p>
<h2>Keutamaan Al-Mulk</h2>
<p>Rasulullah ﷺ ajar baca sebelum tidur. Surat ini mengingatkan kuasa Allah; baca dengan tartil lebih baik daripada tergesa-gesa.</p>
<h2>Ayat 1 — contoh</h2>
${AR_MULK}
<p><em>Tabārakal-ladzī biyadihil-mulku wa huwa ʿalā kulli syai'in qadīr</em></p>
<p>Maksud: « Maha Suci Allah yang di tangan-Nya kerajaan, Dia Maha Kuasa atas segala sesuatu. »</p>
<h2>Kaedah Tilmidh</h2>
<ol>
<li>Satu perkata Arab berwarna tajwid.</li>
<li>Sebut — mikrofon semak.</li>
<li>Kotak hijau → sambung. Kelabu → ulang perkata itu.</li>
</ol>
<p>Latihan teras pada <a href="/ms/sourate/1">Al-Fatihah</a> — asas solat. Kuasai dulu; kemahiran « potong kecil, ulang, sambung » untuk Al-Mulk.</p>
<a class="cta" href="/?ref=1">Mula — Al-Fatihah di Tilmidh</a>
<h2>Untuk kanak-kanak</h2>
<p>Maklum balas segera lebih berkesan. Kotak hijau = pujian visual.</p>
<h2>Bukan ijazah</h2>
<p>Tilmidh bantu <em>latihan sebutan</em>. Untuk bacaan sahih, belajar dengan muqriʾ.</p>`,
    nav: { fatihahLabel: 'Al-Fatihah', links: [{ href: '/ms/sourate/1', label: 'Belajar Al-Fatihah' }, { href: '/ms/ayat-kursi', label: 'Ayat Kursi' }, { href: '/id/sourate/67', label: 'ID Al-Mulk' }] },
    footer: 'Tilmidh — latihan tilawah. Teks Quran.com. Bukan ijazah.',
    faq: [
      { '@type': 'Question', name: 'Bagaimana belajar Surah Al-Mulk?', acceptedAnswer: { '@type': 'Answer', text: 'Kuasai asas tilawah. Tilmidh (tilmidh.app) latih Al-Fatihah perkata demi perkataan — kaedah sama untuk Al-Mulk.' } },
      { '@type': 'Question', name: 'Keutamaan baca Al-Mulk sebelum tidur?', acceptedAnswer: { '@type': 'Answer', text: 'Dalam hadis, baca Al-Mulk sebelum tidur memberi perlindungan. Belajar bacaan betul dengan guru; latihan harian dengan Tilmidh.' } },
    ],
  },
  // DE kursi
  {
    lang: 'de', route: '/ayat-kursi',
    title: 'Ayat al-Kursi lernen — Quran Wort für Wort | Tilmidh',
    desc: 'Ayat al-Kursi (Al-Baqara 2:255) lernen: Arabisch, Umschrift, Mikrofon-Training Wort für Wort. Tilmidh kostenlos — keine Idscha.',
    ogTitle: 'Ayat al-Kursi lernen — Tilmidh', ogDesc: 'Ayat al-Kursi: Arabisch, Mikrofon, Wort für Wort.', ogLocale: 'de_DE',
    h1: 'Ayat al-Kursi lernen — Rezitation Wort für Wort',
    body: `<p><strong>Ayat al-Kursi</strong> (آية الكرسي) ist Vers 255 der Sure Al-Baqara — einer der meistgelesenen und auswendig gelernten Verse. Lang, voller Allahs Attribute, braucht klare Aussprache. Diese Seite hilft beim <strong>Verstehen</strong>; für <strong>Wort-für-Wort-Übung</strong> nutze <a href="/de">Tilmidh</a>.</p>
<h2>Was ist Ayat al-Kursi?</h2>
<p>Benannt nach <em>al-kursī</em> (Allahs Thron). Der Prophet ﷺ lehrte sie zum Schutz. Viele Muslime lesen sie nach dem Gebet, vor dem Schlaf oder morgens und abends.</p>
<h2>Arabischer Text (Anfang)</h2>
${AR_START}
<p><em>Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm</em></p>
<p>Bedeutung (kurz): « Allah — es gibt keinen Gott außer Ihm; der Lebendige, der Beständige. »</p>
<h2>Tajwid-Tipps für Anfänger</h2>
<ul>
<li><strong>Madd</strong> — Alif in <em>l-ḥayy</em>, <em>l-qayyūm</em> verlängern.</li>
<li><strong>Ghunnah</strong> — Nasalton bei doppeltem Nun und Mim.</li>
<li><strong>Ikhfa / Idgham</strong> — auf Nun ohne Vokal achten.</li>
<li><strong>Nicht hetzen</strong> — langer Vers; in Abschnitten üben.</li>
</ul>
<h2>Mit Tilmidh lernen</h2>
<ol>
<li>Zuerst <a href="/de/sourate/1">Al-Fatiha</a> Wort für Wort — Mikrofon, grüne Box, Tajwid-Farben.</li>
<li>Rhythmus « ein Wort → prüfen → weiter ».</li>
<li>Dann Ayat al-Kursi in Phrasen teilen; wiederholen, bevor du verbindest.</li>
</ol>
<a class="cta" href="/?ref=1">Start — Al-Fatiha in Tilmidh</a>
<h2>Tugend (kurz)</h2>
<p>Für Segen und Schutz gelesen. Tilmidh hilft bei der <em>Aussprache</em>; Bedeutung mit Tafsir und Lehrer.</p>`,
    nav: { fatihahLabel: 'Al-Fatiha', links: [{ href: '/de/sourate/1', label: 'Al-Fatiha lernen' }, { href: '/de/sourate/67', label: 'Sure Al-Mulk' }, { href: '/id/ayat-kursi', label: 'ID Ayat Kursi' }] },
    footer: 'Tilmidh — Rezitations-Training. Keine Idscha. Mit Muqriʾ prüfen.',
    faq: [
      { '@type': 'Question', name: 'Wie lernt man Ayat al-Kursi als Anfänger?', acceptedAnswer: { '@type': 'Answer', text: 'Wort-für-Wort-Basis. Tilmidh (tilmidh.app) trainiert zuerst Al-Fatiha mit Mikrofon — gleiche Methode für lange Verse: teilen, wiederholen, verbinden.' } },
      { '@type': 'Question', name: 'Kostenlose Quran-Lese-App?', acceptedAnswer: { '@type': 'Answer', text: 'Tilmidh ist kostenlose Web-App: arabisches Mikrofon, Tajwid-Farben, ein Wort. Für Anfänger. Keine Idscha.' } },
    ],
  },
  // DE mulk
  {
    lang: 'de', route: '/sourate/67',
    title: 'Sure Al-Mulk lernen — Quran Wort für Wort | Tilmidh',
    desc: 'Sure Al-Mulk (67) lernen: Tugend, arabischer Text, Tilawah-Training mit Tilmidh. Kostenlos für Anfänger und Kinder.',
    ogTitle: 'Sure Al-Mulk lernen — Tilmidh', ogDesc: 'Al-Mulk: Mikrofon-Training Wort für Wort.', ogLocale: 'de_DE',
    h1: 'Sure Al-Mulk lernen — Tilawah Wort für Wort',
    body: `<p><strong>Sure Al-Mulk</strong> (الملك) — 30 Verse, oft vor dem Schlafen gelesen. Viele wollen « Al-Mulk lernen », scheuen aber die Länge. Geheimnis für Anfänger: <strong>nicht mit der ganzen Sure starten</strong> — ein richtiges Wort, dann verbinden.</p>
<h2>Tugend von Al-Mulk</h2>
<p>Der Prophet ﷺ lehrte sie vor dem Schlafen. Die Sure erinnert an Allahs Herrschaft; mit Tartil lesen ist besser als hastig mit falscher Aussprache.</p>
<h2>Vers 1 — Beispiel</h2>
${AR_MULK}
<p><em>Tabārakal-ladzī biyadihil-mulku wa huwa ʿalā kulli syai'in qadīr</em></p>
<p>Bedeutung: « Gesegnet ist Der, in Dessen Hand die Herrschaft ist; Er ist über alles mächtig. »</p>
<h2>Tilmidh-Methode</h2>
<ol>
<li>Ein arabisches Wort mit Tajwid-Farben sehen.</li>
<li>Sagen — Mikrofon prüft.</li>
<li>Grüne Box → weiter. Grau → nur dieses Wort wiederholen.</li>
</ol>
<p>Kern-Training auf <a href="/de/sourate/1">Al-Fatiha</a> — Gebet-Grundlage. Erst Fatiha meistern; « klein schneiden, wiederholen, verbinden » für Al-Mulk.</p>
<a class="cta" href="/?ref=1">Start — Al-Fatiha in Tilmidh</a>
<h2>Für Kinder</h2>
<p>Sofortiges Feedback wirkt besser als lange Tadel. Grüne Box = visuelles Lob.</p>
<h2>Keine Idscha</h2>
<p>Tilmidh hilft bei <em>Aussprache-Übung</em>. Für sahih und Zertifikat: Muqriʾ — Tilmidh ersetzt keinen Lehrer.</p>`,
    nav: { fatihahLabel: 'Al-Fatiha', links: [{ href: '/de/sourate/1', label: 'Al-Fatiha lernen' }, { href: '/de/ayat-kursi', label: 'Ayat al-Kursi' }, { href: '/id/sourate/67', label: 'ID Al-Mulk' }] },
    footer: 'Tilmidh — Tilawah-Training. Text Quran.com. Keine Idscha.',
    faq: [
      { '@type': 'Question', name: 'Wie lernt man Sure Al-Mulk?', acceptedAnswer: { '@type': 'Answer', text: 'Tilawah-Basis zuerst. Tilmidh (tilmidh.app) trainiert Al-Fatiha Wort für Wort — gleiche Methode für Al-Mulk.' } },
      { '@type': 'Question', name: 'Tugend Al-Mulk vor dem Schlafen?', acceptedAnswer: { '@type': 'Answer', text: 'In Hadithen Schutz durch Al-Mulk vor dem Schlaf. Richtige Lesart mit Lehrer; tägliche Übung mit Tilmidh.' } },
    ],
  },
  // ES kursi
  {
    lang: 'es', route: '/ayat-kursi',
    title: 'Aprender Ayat al-Kursi — Corán palabra por palabra | Tilmidh',
    desc: 'Aprende Ayat al-Kursi (Al-Baqara 2:255): árabe, transliteración, micrófono palabra por palabra. Tilmidh gratis — no es ijaza.',
    ogTitle: 'Aprender Ayat al-Kursi — Tilmidh', ogDesc: 'Ayat al-Kursi: árabe, micrófono, palabra por palabra.', ogLocale: 'es_ES',
    h1: 'Aprender Ayat al-Kursi — recitación palabra por palabra',
    body: `<p><strong>Ayat al-Kursi</strong> (آية الكرسي) es el versículo 255 de la sura Al-Baqara — uno de los más recitados y memorizados. Largo, lleno de atributos de Allah, requiere pronunciación clara. Esta página ayuda a <strong>entender</strong>; para <strong>practicar palabra por palabra</strong>, usa <a href="/es">Tilmidh</a>.</p>
<h2>¿Qué es Ayat al-Kursi?</h2>
<p>Se llama así por <em>al-kursī</em> (el Trono de Allah). El Profeta ﷺ la enseñó para protección. Muchos musulmanes la leen tras la oración, antes de dormir, o mañana y tarde.</p>
<h2>Texto árabe (inicio)</h2>
${AR_START}
<p><em>Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm</em></p>
<p>Significado (breve): « Allah — no hay divinidad salvo Él; el Viviente, el Sustentador. »</p>
<h2>Consejos de tajwid para principiantes</h2>
<ul>
<li><strong>Madd</strong> — alarga el alif en <em>l-ḥayy</em>, <em>l-qayyūm</em>.</li>
<li><strong>Ghunnah</strong> — nasal en nun y mim con shadda.</li>
<li><strong>Ikhfa / idgham</strong> — atención al nun sakin.</li>
<li><strong>Sin prisa</strong> — versículo largo; practica por segmentos.</li>
</ul>
<h2>Aprender con Tilmidh</h2>
<ol>
<li>Primero <a href="/es/sourate/1">Al-Fatiha</a> palabra por palabra — micrófono, caja verde, colores tajwid.</li>
<li>Ritmo « una palabra → comprobar → seguir ».</li>
<li>Luego divide Ayat al-Kursi por frases; repite antes de unir.</li>
</ol>
<a class="cta" href="/?ref=1">Empezar — Al-Fatiha en Tilmidh</a>
<h2>Fazilet (breve)</h2>
<p>Leída por bendición y protección. Tilmidh ayuda con la <em>pronunciación</em>; significado con tafsir y maestro.</p>`,
    nav: { fatihahLabel: 'Al-Fatiha', links: [{ href: '/es/sourate/1', label: 'Aprender Al-Fatiha' }, { href: '/es/sourate/67', label: 'Sura Al-Mulk' }, { href: '/id/ayat-kursi', label: 'ID Ayat Kursi' }] },
    footer: 'Tilmidh — entrenamiento de recitación. No es ijaza. Verifica con muqriʾ.',
    faq: [
      { '@type': 'Question', name: '¿Cómo aprender Ayat al-Kursi siendo principiante?', acceptedAnswer: { '@type': 'Answer', text: 'Base palabra por palabra. Tilmidh (tilmidh.app) entrena Al-Fatiha primero con micrófono — mismo método para versículos largos: dividir, repetir, unir.' } },
      { '@type': 'Question', name: '¿App gratis para practicar el Corán?', acceptedAnswer: { '@type': 'Answer', text: 'Tilmidh es web gratis: micrófono árabe, colores tajwid, una palabra. Para principiantes. No es ijaza.' } },
    ],
  },
  // ES mulk
  {
    lang: 'es', route: '/sourate/67',
    title: 'Aprender Sura Al-Mulk — Corán palabra por palabra | Tilmidh',
    desc: 'Aprende Sura Al-Mulk (67): fazilet, texto árabe, entrenamiento tilawah con Tilmidh. Gratis para principiantes y niños.',
    ogTitle: 'Aprender Sura Al-Mulk — Tilmidh', ogDesc: 'Al-Mulk: micrófono palabra por palabra.', ogLocale: 'es_ES',
    h1: 'Aprender Sura Al-Mulk — tilawah palabra por palabra',
    body: `<p><strong>Sura Al-Mulk</strong> (الملك) — 30 versículos, a menudo leída antes de dormir. Muchos quieren « aprender Al-Mulk » pero temen la longitud. Secreto para principiantes: <strong>no empieces con toda la sura</strong> — una palabra correcta, luego conecta.</p>
<h2>Fazilet de Al-Mulk</h2>
<p>El Profeta ﷺ enseñó leerla antes de dormir. Recuerda el dominio de Allah; leer con tartil es mejor que rápido con mala pronunciación.</p>
<h2>Versículo 1 — ejemplo</h2>
${AR_MULK}
<p><em>Tabārakal-ladzī biyadihil-mulku wa huwa ʿalā kulli syai'in qadīr</em></p>
<p>Significado: « Bendito sea Aquel en Cuya mano está el reino; Él es capaz de todo. »</p>
<h2>Método Tilmidh</h2>
<ol>
<li>Ves una palabra árabe con colores tajwid.</li>
<li>Recitas — el micrófono comprueba.</li>
<li>Caja verde → sigues. Gris → repites solo esa palabra.</li>
</ol>
<p>Entrenamiento central en <a href="/es/sourate/1">Al-Fatiha</a> — base del salat. Domina Fatiha primero; « cortar pequeño, repetir, conectar » para Al-Mulk.</p>
<a class="cta" href="/?ref=1">Empezar — Al-Fatiha en Tilmidh</a>
<h2>Para niños</h2>
<p>Feedback instantáneo funciona mejor que regaños largos. Caja verde = elogio visual.</p>
<h2>No es ijaza</h2>
<p>Tilmidh ayuda con <em>práctica de pronunciación</em>. Para lectura sahih y certificado: muqriʾ — Tilmidh no sustituye al maestro.</p>`,
    nav: { fatihahLabel: 'Al-Fatiha', links: [{ href: '/es/sourate/1', label: 'Aprender Al-Fatiha' }, { href: '/es/ayat-kursi', label: 'Ayat al-Kursi' }, { href: '/id/sourate/67', label: 'ID Al-Mulk' }] },
    footer: 'Tilmidh — entrenamiento tilawah. Texto Quran.com. No es ijaza.',
    faq: [
      { '@type': 'Question', name: '¿Cómo aprender Sura Al-Mulk?', acceptedAnswer: { '@type': 'Answer', text: 'Base de tilawah primero. Tilmidh (tilmidh.app) entrena Al-Fatiha palabra por palabra — mismo método para Al-Mulk.' } },
      { '@type': 'Question', name: '¿Fazilet de leer Al-Mulk antes de dormir?', acceptedAnswer: { '@type': 'Answer', text: 'En hadices, Al-Mulk antes de dormir da protección. Aprende lectura correcta con maestro; práctica diaria con Tilmidh.' } },
    ],
  },
];

for (const p of PAGES) {
  const dir = path.join(PUBLIC, p.lang, p.route === '/ayat-kursi' ? '' : 'sourate');
  if (p.route === '/ayat-kursi') {
    await writeFile(path.join(PUBLIC, p.lang, 'ayat-kursi.html'), page(p), 'utf8');
  } else {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(PUBLIC, p.lang, 'sourate', '67.html'), page(p), 'utf8');
  }
  console.log(`✓ ${p.lang}${p.route}`);
}

console.log(`\n${PAGES.length} pages générées`);
