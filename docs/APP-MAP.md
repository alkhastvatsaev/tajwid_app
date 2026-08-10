# APP-MAP — Mémoire d’auteur TAJWID

> Écrit comme si Cursor avait développé l’app depuis le jour 1.  
> Code live = [`public/index.html`](../public/index.html).  
> Audit live = [`ANALYSE-PROD.md`](../ANALYSE-PROD.md).

---

## 0. Histoire produit (ce que tu « te rappelles »)

Tu as construit une PWA-like d’entraînement Tajwid pour mobile :

1. Afficher le Coran avec couleurs Tajwid (tags Quran.com).
2. Écouter la récitation via le micro + Web Speech.
3. Valider mot à mot avec feedback « Cible / Vous dites ».
4. Persister la progression en local (pas de compte).
5. Permettre un Duo Imam/Talib en P2P.

Tu as volontairement tout mis dans **un monolite** pour éviter la complexité build. Une piste Next (`src/`) a existé puis a été **retirée de la prod** (rollback static). En tant qu’auteur, tu traites `public/index.html` comme la vérité.

---

## 1. Anatomie du fichier `public/index.html`

| Zone approximative | Contenu |
|--------------------|---------|
| `<head>` + `:root` | Tokens design (emerald, couleurs règles Tajwid), fonts, PeerJS script |
| CSS long | Layout mobile, `.word-box`, Duo panels, modals, assistant, celebration |
| DOM fixe | Header `#verse-selector`, `#verse-container`, overlays, modals, Duo, start |
| `<script>` | Toute la logique métier |

### Tokens couleur Tajwid (CSS variables)

`--ghunnah` · `--madd-tabii` · `--madd-munfasil` · `--madd-muttasil` · `--madd-lazim` · `--ikhfa` · `--idgham-ghunnah` · `--idgham-no-ghunnah` · `--iqlab` · `--izhar` · `--qalqalah` · `--ham-wasl` · `--accent` (#059669)

### IDs DOM critiques

`verse-container` · `ghost-word-container` · `voice-aura` · `session-progress` · `live-assistant` · `assistant-target-word` · `assistant-heard-word` · `start-overlay` · `daily-verse-card` · `quran-modal` · `import-modal` · `stats-modal` · `duo-selector-overlay` · `duo-panels-container` · `download-btn` · `restart-btn` · `report-diag-btn` · `box-{n}` (générés)

---

## 2. Flux utilisateur (heureux)

```
Ouverture page
  → DOMContentLoaded
  → langue localStorage
  → charge 112, 113, 114, 1 (Fātiḥah active)
  → overlay « Touchez pour commencer »
       ↓ click
  → startRecognition (micro + STT + MediaRecorder + aura)
       ↓ récite
  → checkWordStream → processMatchedWord → box.correct
       ↓ dernier mot
  → finishVerse (celebration, completed, restart, download selon branche)
```

Chemins secondaires : Verset du jour · Import ref · Browser Al-Quran · Duo · Favoris · Stats · Rapport JSON · Clic mot → règle Tajwid.

---

## 3. Pipeline données Coran

### `fetchVerseFromAPI(surah, ayah?)`

- String sans `:` → **chapitre entier** (`by_chapter`, `per_page=286`)
- `surah:ayah` ou deux args → **un verset** (`by_key`)
- Sinon lit `#import-ref`
- Puis `chapters/{id}` pour `name_simple`
- Pousse dans `VERSES_LIBRARY`, `switchVerse(last)`

### Structure d’une entrée `VERSES_LIBRARY[]`

```js
{
  title: "Al-Fatihah",           // name_simple
  ref: "Al-Fatihah [1:1]",     // affichage
  text: "<span class=madda_...>…", // HTML tajweed
  words: [{ en, ru }, ...]       // translit (ru via transliterateToCyrillic)
}
```

### `loadVerse(index)` — cœur du rendu

1. Split `verse.text` sur espaces (ignore espaces dans tags HTML).
2. Ignore marqueurs ﴿﴾ / chiffres seuls.
3. Pour chaque token avec lettres arabes → `.word-box#box-{i}`.
4. Détecte `ruleType` depuis classes Quran.com (`madda_normal` → `madd-tabii`, etc.).
5. Remplit `verseData[]` avec `{ ar, en, ru }` pour le matching.
6. `box-0` reçoit `.active`.

---

## 4. Pipeline voix (ce que tu as conçu pour la robustesse)

### `startRecognition`

- Refuse HTTP non-localhost (micro nécessite HTTPS).
- `getUserMedia` → stream partagé Duo éventuel.
- `AudioContext` + analyser → `trackVolume` (aura + ghost).
- `MediaRecorder` (webm/mp4/aac/ogg selon support) → `audioChunks`.
- `SpeechRecognition` continuous + interim + `ar-SA`.
- Grammar JSGF optionnelle avec les mots du verset.
- `onend` → relance si `isRecording`.
- Init `sessionDiagnostics`.

### `normalize(text)` — contrat

1. Strip HTML + caractères bidirectionnels invisibles  
2. NFD + retire diacritiques occidentaux  
3. Retire harakat / signes coraniques / tatweel  
4. Unifie alifs → ا ; ى→ي ; ة→ه  
5. Lowercase, sans espaces  

### `getRootSkeleton` — retire ا و ي + dé-double lettres (compense STT).

### `checkWordStream` — ordre des tests

exact → root → liaison sans ال → tolérances `انعمت` / `لضالين`  
Si root match mais pas exact + `dataset.ruleType === 'madd'` → `maddMissed`.

### Fin de session

`finishVerse` : stop recognition/recorder, `markAsCompleted`, celebration, UI restart (+ download si CSS/JS le permettent).  
`restartRecitation` : reset UI + `audioChunks = []` + relance STT.

---

## 5. i18n

Objet `translations.fr|en|ru` : strings UI + `legend` + `rules` (modale).  
`setLanguage` écrit le DOM par IDs `txt-*` et `localStorage.tajwid_lang`.  
Translit affichée : `en` ou `ru` selon langue (pas de FR translit dédiée — tu réutilises `en`).

---

## 6. Duo (intention + limites assumées)

- Rôles UI : User 1 (gauche) / User 2 (droite).
- Peer IDs : `vatsaev-tajwid-user1` / `user2` (volontairement simples, collision possible).
- Audio : `peer.call` + answer ; indicateur volume `monitorAudio`.
- Data : `setupDuoConnection` — `sync_match` / `sync_verse` pour surligner le partenaire.
- Tu as wrapé `processMatchedWord` / `switchVerse` pour envoyer les syncs.

---

## 7. Persistance & stats

| Clé | Contenu |
|-----|---------|
| `tajwid_lang` | `fr` \| `en` \| `ru` |
| `tajwid_favorites` | JSON string[] de refs |
| `tajwid_completed` | JSON string[] ; barre = `n/6236` |

Pas de serveur de comptes. Rapport technique = JSON download + tentative `localhost:8000/log`.

---

## 8. `server.py` (outil auteur local)

- `GET /` → `public/index.html`
- `POST /log` → `diagnostic_report.json`
- Utile pour debug STT ; **inutile en prod Vercel**

---

## 9. Repo autour du monolite (ce que tu sais exister)

| Chemin | Rôle dans ton esprit |
|--------|----------------------|
| `public/index.html` | **App** |
| `public/icons/`, `sw.js` | Artefacts Next/PWA éventuellement présents — **pas le cœur métier legacy** |
| `src/` | Tentative Next ; ne pas confondre avec prod |
| `old/`, `old/legacy-spa/` | Archives |
| `docs/APP-MAP.md` | Cette mémoire |
| `.cursor/rules/*` | Injection Cursor |
| `stabilize/legacy-prod` | Branche fix download + server path + docs |

---

## 10. Checklist auteur avant un patch

- [ ] Est-ce que ça touche le matching / micro / Duo / API Quran ?
- [ ] Est-ce que je peux le faire en **un seul** fichier (`public/index.html`) ?
- [ ] Est-ce que je preserve les console.log / setTimeout / try-catch ?
- [ ] Qu’est-ce que l’utilisateur doit tester après ?

---

## 11. Prompt court (à coller en début de chat si besoin)

```
Tu as développé TAJWID de A à Z. Prod = public/index.html (pas src/).
Lis docs/APP-MAP.md + ANALYSE-PROD.md. Règles : ≤3 fichiers, pas de deps/config
sans accord, expliquer avant de modifier, pas d’invention (NON TROUVÉ).
?ref= n’existe pas en legacy. « IA Import » = Quran.com. Zones sacrées :
normalize, checkWordStream, startRecognition, initDuoMode, loadVerse.
```
