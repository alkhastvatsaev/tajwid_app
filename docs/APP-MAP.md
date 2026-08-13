# APP-MAP — Mémoire d’auteur Tilmidh

> Code live = [`public/index.html`](../public/index.html).  
> Audit live = [`ANALYSE-PROD.md`](../ANALYSE-PROD.md).

---

## 0. Histoire produit

PWA-like d’entraînement Tajwid mobile :

1. Coran avec couleurs Tajwid (tags Quran.com `text_uthmani_tajweed`).
2. Micro + **Web Speech API** `ar-SA` (`VOICE_ENGINE = 'webspeech'`).
3. Validation mot à mot + feedback « Cible / Vous dites ».
4. Persistance locale (`localStorage` + cache `sessionStorage`).
5. **Groupe Call** via LiveKit (`api/room/*`) ; Duo PeerJS legacy toujours dans le DOM.
6. Import / browser / `?ref=` / verset du jour actifs (`FATIHA_ONLY = false`).

Monolite volontaire. `src/` Next = **non servi** en prod.

---

## 1. Anatomie `public/index.html`

| Zone | Contenu |
|------|---------|
| `<head>` | GA4, meta OG, fonts, LiveKit client CDN |
| CSS | Mobile-first, `.word-box`, carousel ayahs, modals, Groupe Call |
| DOM | `#verse-selector`, `#verse-container`, `#start-overlay`, modals, Voice Lab |
| `<script>` | API Quran, STT, matching, LiveKit group call |

### IDs DOM critiques

`verse-container` · `start-overlay` · `live-assistant` · `voice-lab-modal` · `quran-modal` · `import-modal` · `stats-modal` · `group-call-bar` · `download-btn` · `report-diag-btn` · `box-{n}`

---

## 2. Flux utilisateur

```
Ouverture
  → thème localStorage.tajwid_theme (défaut blue)
  → boot : sourates 112, 113, 114, 1 puis ?ref= si présent
  → overlay « Touchez pour commencer » (#start-overlay)
       ↓ click overlay (pas de pointerdown global)
  → startRecognition (Web Speech si dispo ; sinon message navigateur)
       ↓ récite
  → checkWordStream → processMatchedWord → .word-box.correct (bleu)
       ↓ dernier mot
  → finishVerse (celebration, completed, restart, download)
```

Chemins : Verset du jour · Import · Browser · Favoris · Stats · Rapport · Voice Lab (manuel) · Groupe Call · clic tajweed → modale règle.

---

## 3. Pipeline Coran

### `fetchVerseFromAPI`

- Chapitre entier ou `surah:ayah` via Quran.com v4.
- `upsertVerseEntry` (pas de doublons) + `cacheVerseEntry` (sessionStorage).
- Fallback : cache session → `OFFLINE_VERSES[1]` (Al-Fātiḥah embarquée).
- `mapApiWord` : translit optionnelle (`w.transliteration?.text`).

### Madd Fātiḥah

- `expandMaddCombining`, `applyFatihaTabiiMarkup`, `FATIHA_TABII_EXTRA`.
- `madda_permissible` : couleur héritée (ʿāriḍ), points au-dessus seulement.

---

## 4. Pipeline voix

- `hasWebSpeech()` + `showSttUnsupportedHint()` (Firefox / Chrome iOS).
- `STT_WINDOW` : 5 (mode balanced).
- Whisper : code présent pour juge post-ayah / dataset ; moteur live = Web Speech.
- `finishVerse` : n’ouvre plus Voice Lab automatiquement.

---

## 5. Persistance

| Clé | Contenu |
|-----|---------|
| `tajwid_lang` | fr \| en \| ru |
| `tajwid_theme` | blue \| light \| … |
| `tajwid_favorites` | refs JSON |
| `tajwid_completed` | refs JSON ; % = `completed / max(library ayahs, completed)` |
| `tajwid_cache_{n}` | sessionStorage — dernier chapitre chargé |

---

## 6. APIs Vercel / local

| Route | Prod Vercel | Local `server.py` |
|-------|-------------|-------------------|
| `POST /log` | `api/log.js` (rewrite) | `diagnostic_report.json` |
| `POST /save-recording` | `api/save-recording.js` → Blob | `recordings/` |
| `POST /api/room/*` | LiveKit + `ROOM_PEPPER` / HMAC fallback dev |

`server.py` : FastAPI si installé, sinon **http.server** stdlib (port 3000).

---

## 7. Checklist patch

- [ ] Matching / micro / API Quran / overlay start ?
- [ ] ≤3 fichiers si possible ; pas de deps sans accord
- [ ] Tester : overlay, ?ref=1:1, import, stats, Firefox message, hors-ligne Fātiḥah

---

## Prompt court

```
Prod = public/index.html. FATIHA_ONLY=false. ?ref= actif au boot.
Micro = click #start-overlay only. VOICE_ENGINE=webspeech.
Zones sacrées : normalize, checkWordStream, startRecognition, loadVerse, fetchVerseFromAPI.
```
