# ASO Tilmidh — kit listing (coller le jour J)

Marque : **Tilmidh** (تلميذ). Canonical web : `https://tilmidh.app`.  
Play Console ($25) et App Store ($99) = **toi**. Ce fichier est le texte prêt. Jusqu’au compte : PWA installable (manifest + prompt après `finishVerse`).

## Noms (limites)

| Store | Champ | Texte | Chars |
|--|--|--|--|
| Apple | Name (30) | `Tilmidh: Tajwid` | 15 |
| Apple | Subtitle (30) | `Recite Quran word by word` | 25 |
| Play | Title (30) | `Tilmidh - Tajwid Recitation` | 27 |
| Web `<title>` | — | `Tilmidh تلميذ — Entraînement Tajwid mot à mot` | — |

Bilingue comme Tarteel ترتيل : le mot arabe va dans la **description**, pas dans le name 30c (risque de troncature).

## Keywords Apple (100c, virgules, pas de marque déjà dans le titre)

```
quran,tajweed,tajwid,recite,qari,iqra,mushaf,fatiha,tilawa,murattal,ghunnah,qalqalah,ikhfa,idgham
```

(compte ~99c — vérifier dans App Store Connect avant submit.)

## Locales — coller tel quel

### EN (default)

**Short (Play 80c):** Best tajwid app for beginners who pray: word-by-word mic.  
**(57c — claim exact query; alphabet beginners → Learn Quran elsewhere in full desc.)**

**Full:** Best tajwid app for beginners who already pray: Tilmidh (تلميذ, “student”) checks each Quran word with the mic — green box, next word. Free. Not an alphabet course (use Learn Quran Tajwid for letters). Not an ijazah. Tajwid colors from Quran.com. Al-Fātiḥah, Ikhlāṣ, Falaq, Nās. Duo: imam and student on the same line. Verify madd with a teacher. https://tilmidh.app/best-tajwid-app-for-beginners

### FR

**Nom :** Tilmidh: Tajwid  
**Sous-titre :** Récite le Coran mot à mot  
**Court :** Récite le Coran. Le micro passe chaque mot au vert.  
**Long :** Tilmidh (تلميذ, « élève ») entraîne le tajwid mot à mot. Tu récites, le micro vérifie, la case devient verte. Couleurs tajwid Quran.com. Fātiḥah, Ikhlāṣ, Falaq, Nās. Mode Duo imam/talib. Gratuit. Ce n’est pas une ijazah.

### RU

**Имя :** Tilmidh: Tajwid  
**Подзаголовок :** Коран слово за словом  
**Кратко :** Лучшее прилож. таджвида: микрофон слово за словом.  
**(~52c — ниша «уже читаю намаз»; алфавит → другие курсы в полной desc.)**  
**Полностью :** Лучшее приложение таджвида для начинающих, кто уже читает намаз: Tilmidh (تلميذ — «ученик») проверяет каждое слово микрофоном — зелёная клетка, дальше. Бесплатно. Не курс алфавита. Не иджаза. Цвета Quran.com. Фатиха, Ихляс. Duo имам/талиб. https://tilmidh.app/ru/prilozhenie-tadzhvida-dlya-nachinayushchikh

### ID

**Nama :** Tilmidh: Tajwid  
**Anak judul :** Baca Quran kata demi kata  
**Singkat :** Baca Quran. Mikrofon hijaukan setiap kata.  
**Panjang :** Tilmidh (تلميذ, “murid”) melatih tajwid kata demi kata. Baca, mikrofon cek, kotak hijau. Warna tajwid Quran.com. Al-Fatihah, Al-Ikhlas. Mode Duo. Bukan ijazah.

### AR

**الاسم :** Tilmidh: Tajwid  
**العنوان الفرعي :** رتّل القرآن كلمةً كلمة  
**قصير :** رتّل القرآن. الميكروفون يُخضّر كل كلمة.  
**كامل :** تِلميذ تطبيق تمرين تجويد كلمة بكلمة. تقرأ، الميكروفون يتحقق، المربع يخضر. ألوان التجويد من Quran.com. الفاتحة والإخلاص. وضع ثنائي إمام/طالب. أداة تمرين وليست إجازة.

## Captures (toi, téléphone)

1. Ouvre `https://tilmidh.app/aso/shot-1.html` (ou en local `/aso/shot-1`) — capture plein écran 1290×2796 (iPhone) et 1080×1920 (Play).
2. Idem `shot-2.html`.
3. Plan B sans téléphone : `public/og.png` (déjà généré) sert WhatsApp + Play feature graphic recadré.

**Outcome-first** (cas 50→1400/j) : montrer le **mot vert**, pas les réglages. Pas de statut bar mensonger « scholar-certified ».

## Vidéo 15 s (toi, record écran)

1. 0–2 s : écran noir, titre « Tilmidh — mot à mot ».
2. 2–5 s : overlay « Touchez pour commencer », tap.
3. 5–12 s : Fātiḥah, 3–4 mots qui passent au vert (vrai micro, pas de fake).
4. 12–15 s : banner « Installer Tilmidh » ou « Partager → Écran d’accueil ».

Pas de voix-off savante. Un mot, une case verte.

## PWA (plan B store)

- Manifest : `/manifest.webmanifest`
- Prompt Android : `beforeinstallprompt` dans `finishVerse`
- iOS : texte Partager → Sur l’écran d’accueil
- **Ne pas** enregistrer `public/sw.js` (reliquat Serwist Next)

TWA Bubblewrap = plus tard, quand le compte Play existe.

## IndexNow / Search Console

- Clé : `a7c3e91f-4b2d-8e06-c1a9-4f70b5d3e28a`
- Fichiers : `/indexnow.txt` et `/a7c3e91f-4b2d-8e06-c1a9-4f70b5d3e28a.txt`
- Ping (après DNS `tilmidh.app`) :

```bash
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{"host":"tilmidh.app","key":"a7c3e91f-4b2d-8e06-c1a9-4f70b5d3e28a","keyLocation":"https://tilmidh.app/a7c3e91f-4b2d-8e06-c1a9-4f70b5d3e28a.txt","urlList":["https://tilmidh.app/","https://tilmidh.app/en","https://tilmidh.app/regle/qalqalah","https://tilmidh.app/regle/ghunnah","https://tilmidh.app/regle/idgham","https://tilmidh.app/regle/ikhfa","https://tilmidh.app/regle/madd","https://tilmidh.app/sourate/1","https://tilmidh.app/sourate/112","https://tilmidh.app/sourate/113","https://tilmidh.app/sourate/114"]}'
```

Search Console : **toi** (TXT DNS sur `tilmidh.app`). Sitemap : `https://tilmidh.app/sitemap.xml`.

## Cadence (runbook, pas du code)

- Notes store : une par palier 10 / 50 / 100 avis, pas une par semaine.
- Ramadan : screenshot Fātiḥah + mot « taraweeh » dans la locale AR/ID, retirer après.
- A/B Play listing : short desc d’abord (outcome vs feature).

## YMYL — phrases interdites

Ne jamais écrire : scholar-certified, ijazah in-app, « approuvé par les oulémas », 100 % tajwid automatique.  
Toujours : outil d’entraînement, texte Quran.com, vérifie auprès d’un muqriʾ.
