# Stratégie SEO + ASO — TAJWID

> Date : 11 août 2026  
> Outils : agent-reach (doctor) — Exa + Jina Reader + fetch prod live  
> Cible : **trafic organique, 0 pub payante**, des milliers d’utilisateurs en 6–12 mois  
> App live : https://tajwid-app-vatsaev.vercel.app/ = `public/index.html`

---

## 0. Verdict honnête (lire avant le plan)

Les « millions d’users sans pub » que tu as en tête existent. Ils ne sont **pas** le fruit d’un titre magique en 30 jours. Les cas sourcés se répartissent en 3 ligues :

| Ligue | Exemple | Échelle | Temps | Levier réel |
|--|--|--|--|--|
| Infra-contenu | Quran.com | **50M MAU** | 10+ ans | 6 236 pages ayah indexables + SSG |
| Habitude quotidienne | Muslim Pro 190M, Quran Majeed 100M | 2010 → aujourd’hui | Adhan / mushaf + ASO bilingue |
| ASO systématique | Aloha Browser | +1M users **stores / mois** | 3 ASO à temps plein, update / 3 semaines |
| Indie reproductible | FocusFlow 10k / 6 mois ; app stuck 50→1 400 installs/jour en 9 semaines | semaines–mois | Listing + long-tails + notes |

**TAJWID aujourd’hui n’est même pas dans les stores.** Le canal #1, c’est Google Web. Les millions de Tarteel (10–15M, titre `Tarteel ترتيل - AI Quran`) et Learn Quran Tajwid (4M+ depuis **2013**, mot-clé dans le nom) ne sont pas copiables en collant « Tajwid » dans le `<title>`.

Objectif réaliste sans pub : **1 000–10 000 users organiques en 12 mois** si tu exécutes le plan ci-dessous. Les millions, c’est 5–10 ans + stores + Ramadan qui compose.

---

## 1. Audit SEO prod (faits, 11 août 2026)

Fetch live de `https://tajwid-app-vatsaev.vercel.app/` :

| Signal | État | Impact |
|--|--|--|
| `<title>` | `TAJWID-VATSAEV` | Personne ne tape ça. Google n’a rien à matcher. |
| `<meta name="description">` | **absent** | Snippet Google = garbage / rien |
| Open Graph / Twitter cards | **absents** | WhatsApp / Telegram / X n’affichent pas de carte |
| `canonical` | **absent** | |
| JSON-LD | **absent** | |
| `robots.txt` | **404** | |
| `sitemap.xml` | **404** | Google ne découvre qu’une URL |
| `<html lang>` | `fr` figé | EN / RU existent en i18n localStorage, **invisibles** pour Google |
| Indexation | 1 seul HTML SPA ~137 ko | Google voit Fātiḥah. `?ref=41:1` **ignoré** (voir `ANALYSE-PROD.md`) |
| Domaine | `*.vercel.app` | Autorité faible vs un `.app` / `.com` à toi |
| Stores | **pas sur App Store ni Play** | 0 ASO possible tant que ce n’est pas shippé |

Le produit est bon (couleurs tajwid, matching mot à mot, Duo). **Google et les stores ne peuvent pas le trouver.** C’est exactement le diagnostic de l’app stuck à 50 installs/jour : ce n’était pas le produit, c’était les 15 premières secondes d’attention.

---

## 2. Ce que les gens qui ont réussi ont vraiment fait

Sources lues (Jina / Exa). Pas de légende : extraits de leurs propres récits.

### 2.1 Quran.com — 50M+ MAU, SEO web (le modèle #1 pour toi)

- Frontend **isomorphic « for SEO reasons »** ([github.com/quran/quran.com-frontend](https://github.com/quran/quran.com-frontend)).
- Next.js : **SSG des 114 sourates** (le texte ne change pas) + ISR tafsir + SSR dashboard ([DEV 2026](https://dev.to/mzunain/how-we-scaled-qurancom-to-50m-monthly-users-architecture-lessons-from-the-inside-cbi), [Medium Zulqarnain](https://zunain.medium.com/how-we-scaled-quran-com-8b54581780a1)).
- Une URL par sourate / ayah / langue → des milliers de requêtes longue traîne (`surah al falaki`, `ya-sin`, wazifa, etc. — [keyoptimize.com/site-info/quran.com](https://keyoptimize.com/site-info/quran.com)).
- Perf = SEO : subset fonts −40 % mobile, player en dynamic import (68 % des users ne le téléchargent pas), prefetch sourate suivante.
- Saisonnalité : **Ramadan**. Ils préchauffent le CDN 48 h avant. Un deploy qui casse le cache key = +800 % d’origine en 12 min.

**Leçon TAJWID :** une SPA unique ne peut pas battre Quran.com sur « quran ». Elle peut gagner des pages **règle tajwid + pratique micro** qu’eux n’ont pas (ils lisent, tu **corriges**).

### 2.2 Aloha Browser — ASO = canal principal, +1M users stores / mois

[asodesk.com/cases/aloha](https://asodesk.com/cases/aloha) :

- **Pas de pub** (privacy : pas de SDK tracking → pas d’ads).
- 3 personnes ASO. Update **toutes les 3 semaines**. Native speakers pour valider les keywords par GEO (Corée, Iran, DE, JP).
- Depuis ASO systématique : organique **×4 App Store**, **×2,5–3 Play**. Top 3 sur les queries cœur dans les marchés clés.

**Leçon :** l’ASO n’est pas un one-shot de titre. C’est une cadence (listing + keywords + GEO) aussi régulière que tes commits.

### 2.3 Learn Quran Tajwid — 4M+ depuis 2013

[tajwid.learn-quran.co](https://tajwid.learn-quran.co/) + fiche Play `com.bi.learnquran` :

- Nom = **la requête** : `Learn Quran Tajwid` (ils ont pris le mot générique **quand il était vide**, en 2013).
- Description Play bourrée de : tajweed, makharij, tarteel, alphabet, fat-hah, waqf, idghaam… (keyword field Android).
- Preuve sociale ASO : « scholar-certified », sanad Qiraat al-ʿAshr, 4.8★, 190 pays.
- Site web **en plus** du store : landing indexable qui répète les 23 topics (chacun = une requête).

**Leçon :** trop tard pour t’appeler « Tajwid » tout court. Eux ont 13 ans d’avance. Toi tu prends les **long-tails de pratique** (`tajwid microphone`, `qalqalah practice`, `fatiha recitation check`).

### 2.4 Tarteel — 10–15M, ASO bilingue + mot unique

Fiche store (FoxData / Unwrapped 2024) :

- Titre : **`Tarteel ترتيل - AI Quran`** — marque unique + arabe + catégorie.
- Description : « Shazam for Quran », hide verses, word-level errors, 15M Muslims.
- Ils ont un **mot que personne d’autre ne peut rank** (`Tarteel`) **et** le keyword dans le sous-titre.
- Croissance Ramadan visible (Sensor Tower SA Q3 2025 : downloads 4.4k → 48.4k / semaine).

**Leçon :** marque vide (Harfan / Hurufi) + `Tajwid` dans le sous-titre. Jamais l’inverse.

### 2.5 Muslim Pro (190M) / Quran Majeed (100M+)

Pas « SEO pur » : **habitude Adhan** depuis 2010 + listing bilingue AR/EN + 40+ langues. Quran Majeed : titre `Quran Majeed – القران الكريم`. Muslim Pro a un **site web SEO** (`muslimpro.com/holy-quran-app`) qui pousse vers le store (FAQ, tajweed colors, translations).

**Leçon :** le store sans pages web = tu rates Google. Le web sans store = tu rates les gens qui tapent dans Play. Les deux.

### 2.6 Rootd — 2M downloads, 0 salarié, 0 levée (RevenueCat / Sub Club)

- ASO : un prestataire a poussé des **gros keywords peu pertinents → les downloads ont chuté**. Elle est revenue aux **keywords pertinents à faible volume**.
- 0 ads, mais : communiqués de presse mensuels, dates nationales, **15 soumissions** avant Apple Editors’ Choice.

**Leçon :** un gros mot-clé hors-sujet te descend. La « feature Apple » est de l’ASO gratuit, pas de la pub.

### 2.7 App stuck ~50 → ~1 400 installs organiques / jour en 9 semaines

[appstorereview.app/guides/aso-basics-stuck-app-case-study](https://appstorereview.app/guides/aso-basics-stuck-app-case-study) — **0 pub, 0 influenceurs** :

1. **Icône** : 4 variantes, +38 % de préférence → tap-through immédiat.
2. **Screenshots outcome-first** (pas « feature labels ») : conversion 28 % → **41 %**.
3. **Preview vidéo 15 s** muette (Apple autoplay dans la recherche).
4. Abandonner « habit tracker » volume 70 rank #80. Gagner **#3 sur volume 25** (`morning routine app`).
5. Localiser **DE / BR / MX** (pas US). Brésil sous-estimé.
6. Demander la note **après la valeur** (fin de 1re semaine), pas au launch. 4.1 → 4.6.

Ce qui n’a **presque rien** bougé : le pavé description iOS, le stuffing du subtitle.

### 2.8 FocusFlow — 10 847 installs, $0 ads, 6 mois

[asoboost.dev/resources/how-we-got-10000-app-installs-zero-marketing-budget](https://www.asoboost.dev/resources/how-we-got-10000-app-installs-zero-marketing-budget/) :

- Renommer `FocusFlow` → **`FocusFlow: Productivity Timer`**.
- Screenshots +47 % conversion.
- Notes 3.8 → 4.6 (prompt au bon moment).
- **Pas que l’ASO** : 1 article blog « 10 techniques » = 1 500 installs ; 1 TikTok feature = 2 000 ; Product Hunt #3 = 2 500 / 24 h ; Reddit utile (pas spam) = 800.
- Ils regrettent d’avoir built **en secret** 3 mois.

**Leçon pour TAJWID :** SEO store + **pages / contenus qui répondent à une question** + montrer le matching mot à mot en vidéo. Le Duo Imam/Talib est un « aha » filmable en 15 s.

---

## 3. Playbook extrait (ce qui se répète)

1. **Ne pas viser le mot générique** que les incumbents tiennent depuis 2010–2013 (`tajwid`, `quran`, `habit tracker`).
2. **Marque unique + keyword dans le sous-titre** (Tarteel, FocusFlow, Quran Majeed bilingue).
3. **Une URL indexable par intention** (Quran.com ayah ; Learn Quran 23 topics).
4. **Long-tails où tu peux être top 5**, pas top 80 d’un volume énorme (Rootd, stuck app).
5. **Localisation humaine** des stores (Aloha GEO, stuck app DE/BR/MX). Pour toi : **FR, EN, RU, AR, ID** (l’Indonésie est le cœur du tajwid mobile).
6. **Conversion listing** : icône → screenshot 1 outcome → vidéo 15 s (stuck app).
7. **Note après le wow** (chez toi : `finishVerse` / célébration, pas l’overlay de boot).
8. **Cadence** : relister / republier toutes les 2–3 semaines (Aloha).
9. **Saison** : Ramadan = 10× la demande. Préparer pages + store 4 semaines avant. Ne pas casser le cache (Quran.com).
10. **Web + store**, pas l’un ou l’autre (Muslim Pro, Learn Quran).

---

## 4. Stratégie TAJWID — 90 jours (0 pub)

Le monolite `public/index.html` reste le trainer. On n’en fait pas un Next. On **ajoute des pages crawlables** et on rend le trainer partageable.

### Phase A — Semaines 1–2 : Google peut enfin te voir

Sans ça, le reste est du vent.

1. **Domaine à toi** (ex. `harfan.app` / celui que tu valides) → rewrite Vercel déjà en place.
2. **`<title>` + description + OG** sur le monolite, ex. :
   - Title : `Harfan — Entraînement Tajwid mot à mot`
   - Description : `Récite le Coran, le micro vérifie chaque mot. Couleurs tajwid, Fātiḥah, Ikhlāṣ, Duo imam/talib. Gratuit.`
3. **`robots.txt` + `sitemap.xml`** (aujourd’hui 404).
4. **Réparer `?ref=`** dans le legacy (mort en prod, `ANALYSE-PROD.md`). Sans deep link, **aucune page sourate n’est partageable ni indexable**.
5. JSON-LD `WebApplication` (nom, url, offers: 0, inLanguage: fr/en/ru).

À tester : `view-source` + [Rich Results Test](https://search.google.com/test/rich-results) + Search Console sur le domaine.

### Phase B — Semaines 2–6 : SEO programmatique « lite » (le coup Quran.com)

Google n’indexe pas un canvas JS. Il indexe du **HTML texte**.

Créer des pages statiques (fichiers HTML courts, pas un rewrite Next) :

| URL | Intention (requête à gagner) |
|--|--|
| `/` | marque + « entraînement tajwid micro » |
| `/regle/qalqalah` | `qalqalah practice`, `apprendre qalqalah` |
| `/regle/ghunnah` | `ghunnah tajwid` |
| `/regle/idgham` | `idgham avec ghunnah` |
| `/regle/ikhfa` | `ikhfa tajwid exemples` |
| `/regle/madd` | `madd tabii munfasil` |
| `/sourate/1` | `tajwid fatiha`, `réciter fatiha correctement` |
| `/sourate/112` | `ikhlas tajwid` |
| `/sourate/113` | `falaq tajwid` |
| `/sourate/114` | `nas tajwid` |
| `/fr/`, `/en/`, `/ru/` | hreflang (tes 3 langues déjà dans l’app) |

Chaque page : 300–600 mots **utiles** (la règle, un exemple Coran, « ouvre le trainer sur ce verset ») + lien `/?ref=1:1` (une fois `?ref=` vivant) + le mot-clé **une fois** dans H1.

C’est exactement Learn Quran (23 topics) + Quran.com (une URL par unité), en miniature.

**Interdit :** viser `tajwid app` / `learn quran tajwid`. Learn Quran Tajwid et Tarteel tiennent la page 1.

### Phase C — Semaines 4–8 : ASO (ship Play d’abord, Apple ensuite)

Play est plus simple pour une PWA (TWA / wrapping). Apple si tu as un Mac + compte.

**Listing (copie Tarteel + FocusFlow + stuck app) :**

- Nom Play (30c) : `Harfan - Tajwid Recitation` (ou Hurufi / Tilmidh si tu refuses Harfan)
- Nom Apple : `Harfan: Tajwid` + sous-titre `Recite Quran word by word`
- Titre bilingue plus tard : `Harfan حرفان - Tajwid` (pattern Tarteel / Quran Majeed)
- Keywords Apple (100c, virgules, **pas de répétition du titre**) :  
  `recitation,makhraj,qalqalah,ghunnah,fatiha,hifz,tilawa,microphone,practice,ikhlas`
- Play short description = la phrase outcome : *Récite. Le mot s’allume. Corrige.*

**Assets (l’ordre du case 50→1400/j) :**

1. Icône : tester 3 variantes (lettre arabe emerald vs micro vs mushaf). L’icône actuelle n’existe pas en store : c’est un levier gratuit.
2. Screenshot 1 (FR) : *« Le micro dit si le mot est juste »* + capture `Cible / Vous dites`.
3. Screenshot 2 : avant/après (mot gris → vert).
4. Vidéo 15 s muette : réciter Fātiḥah, les boxes `.correct` s’allument. C’est ton autoplay Apple.
5. Locales listing : **FR, EN, RU, ID, AR**. ID surtout (marché Learn Quran). Pas de Google Translate collé (Aloha / stuck app : natifs).

**Notes :** prompt **après** `finishVerse` (célébration), jamais sur `start-overlay`. Cible 4.6★ comme FocusFlow / stuck app.

**Keywords à gagner (top 5 possible) vs à éviter :**

| Gagner (long-tail) | Éviter (incumbents) |
|--|--|
| tajwid microphone / recitation checker | tajwid / tajweed (Wikipedia + Learn Quran) |
| qalqalah practice | quran app (Muslim Pro, Quran.com) |
| fatiha tajwid trainer | tarteel / tartil |
| apprendre idgham exemples | hifz (Tarteel, HifzPath) |
| tajwid français / таджвид практика | iqra / bayan / muslim pro |

Cadence Aloha : **changer screenshots ou keywords toutes les 3 semaines**, mesurer (Play Console / App Analytics).

### Phase D — Semaines 6–12 : contenu qui amène le store (FocusFlow)

Sans pub. Un format, répété :

- 8 articles / vidéos courts : une règle, un verset, un lien trainer.  
  Ex. « Pourquoi الضالين clignote en madd lazim » — pile tes CSS `--madd-lazim`.
- 1 démo 15 s du Duo Imam/Talib (le truc que Tarteel n’a pas en P2P).
- Ramadan −4 semaines : pages Juz ʿAmma (112–114 déjà en boot) + In-App Event iOS si tu es dans le store.

Pas de spam Reddit / groupes WhatsApp. FocusFlow : répondre d’abord, mentionner l’app seulement si on te demande un outil.

---

## 5. Ordre d’exécution (ne pas tout faire d’un coup)

```
Semaine 1    domaine + title/OG + robots/sitemap
Semaine 2    ?ref= vivant  →  pages /sourate/112-114-1
Semaine 3-5  pages /regle/*  (qalqalah, ghunnah, idgham, ikhfa, madd)
Semaine 4    Search Console + indexation
Semaine 6    listing Play (nom, screenshots, vidéo, ID/FR/EN)
Semaine 7    prompt note après finishVerse
Semaine 8-12 cadence ASO 3 semaines + 8 contenus règles
Ramadan      freeze deploy 72 h avant (leçon Quran.com)
```

Hors scope (volontaire) : refonte Next, Firebase, Whisper. Le live reste le monolite.

---

## 6. Comment tu sauras que ça marche

| Semaine | Signal |
|--|--|
| 2 | Search Console : domaine vérifié, sitemap OK |
| 6 | impressions Google sur `qalqalah` / `tajwid fatiha` (même position 20) |
| 8 | 1re page Google sur **au moins 3** long-tails (pas sur `tajwid`) |
| 12 | Play : impressions recherche + 4.5★ si shippé |
| 12 | **1 000+ sessions** organiques cumulées = le plan tient ; sinon c’est que `?ref=` / pages règles n’ont pas été indexées |

Si à 12 semaines Google n’a toujours qu’1 URL (`/`), le programmatique n’est pas en ligne. Rien d’autre ne compensera.

---

## 7. Sources

- Quran.com scale / SSG : [dev.to/mzunain/…](https://dev.to/mzunain/how-we-scaled-qurancom-to-50m-monthly-users-architecture-lessons-from-the-inside-cbi), [zunain.medium.com](https://zunain.medium.com/how-we-scaled-quran-com-8b54581780a1), [github.com/quran/quran.com-frontend](https://github.com/quran/quran.com-frontend)
- Aloha ASO ×4 organique : [asodesk.com/cases/aloha](https://asodesk.com/cases/aloha)
- 50 → 1 400 installs/j, 0 pub : [appstorereview.app/guides/aso-basics-stuck-app-case-study](https://appstorereview.app/guides/aso-basics-stuck-app-case-study)
- FocusFlow 10k / $0 : [asoboost.dev/…](https://www.asoboost.dev/resources/how-we-got-10000-app-installs-zero-marketing-budget/)
- Rootd 2M, keywords pertinents : [revenuecat.com/blog/growth/…rootd](https://www.revenuecat.com/blog/growth/hitting-2m-downloads-without-funding-employees-or-learning-to-code-ania-wysocka-rootd)
- Learn Quran Tajwid 4M : [tajwid.learn-quran.co](https://tajwid.learn-quran.co/)
- Tarteel 10M+ / listing bilingue : [tarteel.ai/blog/tarteel-unwrapped-2024](https://tarteel.ai/blog/tarteel-unwrapped-2024/), FoxData listing US
- Muslim Pro 190M / Quran Majeed 100M : sites et fiches store officiels
- Audit prod TAJWID : [`ANALYSE-PROD.md`](../ANALYSE-PROD.md), fetch live 11 août 2026
