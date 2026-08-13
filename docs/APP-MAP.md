# APP-MAP — Mémoire d’auteur Tilmidh

> Code live = [`public/index.html`](../public/index.html).  
> Audit live = [`ANALYSE-PROD.md`](ANALYSE-PROD.md).  
> Fonts COLR = [`docs/FONTS-TAJWEED-JOINING.md`](FONTS-TAJWEED-JOINING.md).

---

## 0. Histoire produit

PWA-like d’entraînement Tajwid mobile :

1. Coran uthmani + **couleurs tajweed via police COLR** (`KFGQPC Colored` / fallback `TilmidhTajweed`) — pas de `<span>` mid-mot (Safari).
2. Micro + **Web Speech API** `ar-SA` (`VOICE_ENGINE = 'webspeech'`).
3. Validation mot à mot + feedback « Cible / Vous dites ».
4. Persistance locale (`localStorage` + cache `sessionStorage`).
5. **Groupe Call** via LiveKit (`api/room/*`) ; Duo PeerJS legacy toujours dans le DOM.
6. **`FATIHA_ONLY = true`** en prod (branche `ship/colr-tajweed-font`) : Al-Fātiḥah seulement ; mic via tap sur le verset.

Monolite volontaire. `src/` Next = **non servi** en prod.

### Deux cerveaux (volontairement complémentaires)

| Couche | Source | Rôle |
|--------|--------|------|
| Encre colorée | Font COLR (KFGQPC GPL / Tilmidh OFL) | Visuel mushaf, jointures OK |
| Points madd + `data-rule-full` | tags Quran.com + `classifyTajweedRule` | Compte des temps + modale |
| Modale règle | clic `.word-box` → `dataset.ruleFull` | Explication Tilmidh |

---

## 1. Anatomie `public/index.html`

| Zone | Contenu |
|------|---------|
| `<head>` | GA4, meta OG, Outfit CDN + `@font-face` COLR (KFGQPC Colored / KFGQPC Validated blue / Tilmidh Tajweed), LiveKit |
| CSS | Mobile-first, `.word-box`, carousel ayahs (`font-size` fit, pas `scale` sur active) |
| DOM | `#verse-selector`, `#verse-container`, modals, Groupe Call |
| `<script>` | API Quran, STT, matching, LiveKit ; `USE_COLR_TAJWEED_FONT = true` |

### IDs DOM critiques

`verse-container` · `box-{n}` · `modal-overlay` · `group-call-bar`

---

## 2. Flux utilisateur

```
Ouverture (Fātiḥah)
  → thème localStorage.tajwid_theme (défaut blue)
  → boot Al-Fātiḥah
  → tap verset → startRecognition
       ↓ récite
  → checkWordStream → .word-box.correct (KFGQPC Validated = même glyphes, palette bleue)
       ↓ dernier mot
  → finishVerse → Recommencer
```

Clic mot avec règle (pendant enregistrement) → modale via `data-rule-full`.

---

## 3. Pipeline Coran

### `fetchVerseFromAPI`

- Chapitre / ayah via Quran.com v4 (`text_uthmani_tajweed` pour classifier).
- Affichage : `plainUthmaniFromHtml` (tags retirés, **tatweel conservé** pour calt COLR).
- Fallback offline Fātiḥah.

### Madd Fātiḥah

- `applyFatihaTabiiMarkup`, `FATIHA_TABII_EXTRA` → `classifyTajweedRule` + points.
- Couleur lettre = police COLR (pas CSS mid-mot).

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
