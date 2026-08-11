# Stratégie SEO + ASO — Tilmidh

> Date : 11 août 2026 (MAJ live)  
> Marque : **Tilmidh** (تلميذ)  
> Live : **https://tilmidh.app/** = `public/index.html`  
> Play : TWA Bubblewrap (pas une PWA nue). Apple : plus tard.  
> Objectif : trafic réel, 0 pub. Jour 1 = humains ; Google/Bing = 1–7 j ; Play review = heures–7 j.

---

## 0. État live (vérifié CLI 11 août 2026)

| Signal | État |
|--|--|
| Domaine | `tilmidh.app` (Vercel registrar + NS) |
| `www` | 308 → apex |
| Ancien `*.vercel.app` | 307 → tilmidh.app |
| `<title>` / OG / JSON-LD / canonical | Tilmidh |
| `robots.txt` + `sitemap.xml` | 200 |
| `?ref=` | après boot 112→113→114→1 |
| Pages | `/regle/*`, `/sourate/1|112|113|114`, `/en` |
| IndexNow | ping 202 |
| GSC propriété | validée (TXT Vercel) |
| GSC sitemap + URL inspect | **toi** |
| Bing Webmaster | **toi** (import GSC) |
| Privacy / SW / TWA / Play listing | à shipper (cette vague) |

Le trainer reste le monolite. Pas de Next, Firebase, Whisper. Matching / `loadVerse` / `startRecognition` / `initDuoMode` intouchés.

---

## 1. Verdict honnête

Les millions sans pub existent (Quran.com 50M MAU, Learn Quran Tajwid 4M depuis 2013, Tarteel 10–15M, Aloha ASO +1M/mois stores). **Aucun n’a rank #1 sur « tajwid app » en 24 h.**

Objectif réaliste : **1k–10k organiques / 12 mois**. Trafic **aujourd’hui** = WhatsApp, YouTube, Reddit, Product Hunt, imams que tu connais — pas Google page 1.

---

## 2. Playbook (cas sourcés, inchangé)

1. Pas le mot générique tenu depuis 2013 (`tajwid app`).
2. Marque unique + keyword dans le sous-titre (`Tilmidh: Tajwid`).
3. Une URL indexable par intention (Quran.com ayah ; Learn Quran 23 topics).
4. Long-tails top 5, pas top 80 d’un volume énorme.
5. Locales stores : **FR, EN, RU, AR, ID**.
6. Listing : icône → screenshot outcome → vidéo 15 s.
7. Note **après** le wow (`finishVerse`), pas l’overlay.
8. Cadence listing 2–3 semaines (Aloha).
9. Ramadan = 10×. Freeze deploy 72 h avant.
10. **Web + store**, pas l’un ou l’autre.

Sources : Quran.com SSG ; Aloha asodesk ; stuck app 50→1400/j ; FocusFlow 10k/$0 ; Rootd keywords pertinents ; Tarteel bilingue ; Muslim Pro site+store.

---

## 3. Pièces du puzzle qui manquaient (ajout 11 août)

| Pièce | Pourquoi ça ramène du trafic | Action |
|--|--|--|
| **Bing Webmaster** | Bing + Copilot. Import GSC = 2 min, pas un 2e TXT. IndexNow déjà pingé. | Toi : import + sitemap |
| **`llms.txt`** | Citations ChatGPT / Perplexity / Bing AI (canal 2026, Open Mushaf l’a fait) | `/llms.txt` |
| **Privacy URL** | Play refuse le listing sans | `/privacy` |
| **TWA Bubblewrap** | Play 2026 policy 4.3 : PWA nue / WebView = rejet. TWA + SW + `assetlinks.json` | AAB |
| **SW minuscule** | Installabilité Chrome + offline basique. **Pas** le reliquat Serwist `public/sw.js` | `sw-tilmidh.js` |
| **Feature graphic 1024×500** | Obligatoire Play, pas l’og:image 16:9 | `/aso/feature-1024x500.png` |
| **YouTube 15 s** | Indexe plus vite qu’un domaine neuf sur Google Web | Toi record + upload |
| **Product Hunt** | Pic 24 h (FocusFlow 2500) | Draft Education |
| **Reddit 1 post utile** | 800 installs FocusFlow si vraiment utile, spam = ban | 1 sub, pas ijazah |
| **WhatsApp / Telegram** | OG déjà live = carte immédiate | Coller `https://tilmidh.app/` |
| **Duo imams** | Tarteel n’a pas le P2P PeerJS | 3–5 profs que tu connais |

**Interdit listing :** scholar-certified, ijazah in-app, 100 % tajwid auto.

---

## 4. 90 jours (ordre)

```
Jour 1     privacy + llms.txt + landings + SW + TWA AAB
Jour 1     GSC sitemap + 4 URL inspect ; Bing import
Jour 1     YouTube + WhatsApp + PH + Reddit + imams
Jour 1–7   Play review (Internal testing si Production bloque)
Semaine 2  impressions GSC même position 20
Semaine 3  cadence screenshots / keywords
Ramadan-4s Juz ʿAmma + locale AR/ID
```

Hors scope : Apple, Next, rename massif.

---

## 5. Signaux

| Quand | Signal |
|--|--|
| J+0 | OG WhatsApp visible ; `/privacy` 200 ; SW enregistré |
| J+2 | GSC : sitemap « réussi » ; Bing : sitemap fetched |
| J+7 | ≥1 URL « Indexée » ; Play « En revue » ou live |
| S8 | 3 long-tails page 1 (pas `tajwid`) |
| S12 | 1 000+ sessions organiques cumulées |
