# Audit reconnaissance vocale (STT) + plan d’amélioration

> Cible : pipeline live dans [`public/index.html`](../public/index.html)  
> Contexte règles : [`REGLES-TAJWID.md`](REGLES-TAJWID.md)  
> Scope produit : **Al-Fātiḥah uniquement** (`FATIHA_ONLY = true`)  
> Date : août 2026

---

## Verdict

Web Speech seul **ne peut pas** jouer le rôle d’un professeur de tajwīd (30 ans).  
Cause des faux positifs constatés : (1) le moteur **réécrit** souvent ce que tu dis vers le « bon » arabe, (2) notre ancien match **squelette اوي** acceptait trop.  

**Ship Phase 1.5 (`STT_STRICT`)** : exact/alias + 1 edit max + finals only + confidence ≥ 0.72 + plus de squelette.  
**Pour du vrai niveau professeur** : couche audio (forced alignment + GOP / classifieurs de règle) — voir § Recherche.

---

## Recherche agent-reach (GitHub + papers) — meilleures approches

Utilisé : `gh` search/API + arXiv/OpenReview (août 2026).

### Ce que font les systèmes sérieux

| Approche | Idée | Repos / refs | Niveau « professeur » |
|----------|------|--------------|------------------------|
| **GOP** (Goodness of Pronunciation) | Forced alignment → score phonème vs modèle | [tbright17/kaldi-dnn-ali-gop](https://github.com/tbright17/kaldi-dnn-ali-gop), [jimbozhang/kaldi-gop](https://github.com/jimbozhang/kaldi-gop) | Élevé (CAPT classique) |
| **Hybrid ASR + classifieur règle** | ASR aligne le mot, CNN/MLP juge *une* règle (ex. qalqalah) | TajweedAI (OpenReview) | Élevé par règle |
| **ASR phonétique Coran (QPS)** | Alphabet phonétique tajwīd + CTC multi-niveau | arXiv:2509.00094 (Quran MDM) | Très élevé |
| **Forced alignment Coran** | HMM/HTK affinés madd/ghunnah | IEEE Access 2023 (phoneme segmentation) | Prérequis durée |
| **Whisper / wav2vec fine-tuné Coran** | Transcript + compare | [AsemBadr01/Makhraj](https://github.com/AsemBadr01/Makhraj), wav2vec2 QuranRecite | Moyen (toujours texte) |
| **Fuzzy text (Tarteel-like)** | Whisper + Levenshtein pour *tracking* | [yayaiu6/Real-Time-Quran…](https://github.com/yayaiu6/Real-Time-Quran-recitation-tracker-System) | Tracking, **pas** qualité tajwīd |
| **Ahkam DL** | Classif règles de base sur audio | [malayyoub/Ahkam-Al-Tajweed](https://github.com/malayyoub/Ahkam-Al-Tajweed) | Moyen |
| **Phonemizer** | Cible IPA/tajwīd pour scoring | [Hetchy/Quranic-Phonemizer](https://github.com/Hetchy/Quranic-Phonemizer) | Outil, pas juge |

### Architecture cible « professeur » (recommandée pour Tilmidh)

```
Micro
  ├─ (A) Tracker position : ASR (Web Speech court terme → Whisper/NeMo Coran)
  │      → mot courant indexé (Fātiḥah)
  └─ (B) Juge tajwīd : sur le segment audio du mot
         1. Forced align (timestamps)
         2. GOP / posterior phonèmes  → lettres confuses ص/س ض/د
         3. Durée voyelle             → madd 2/4/6
         4. Classifieurs              → ghunnah, qalqalah, ikhfāʾ
         → verdict : OK | erreur typée | « répète »
```

Web Speech reste utile pour (A) seulement. **Jamais** comme juge final.

### Pourquoi « je dis faux et ça valide »

1. Chrome `ar-SA` mappe vers des mots du Coran / arabe courant (LM bias).  
2. Match `getRootSkeleton` (retrait ا و ي) → beaucoup de fautes collapsaient.  
3. Interim results + fenêtre large → avances anticipées.

Mitigation textuelle (1.5) : `STT_STRICT`, finals only, confidence, Levenshtein ≤1, lexicon sans squelette.  
Mitigation réelle : (B) audio.

---

## 1. Architecture actuelle

```
getUserMedia
  → AudioContext/analyser (aura UI seulement)
  → MediaRecorder (export optionnel)
  → SpeechRecognition continuous + interimResults, lang=ar-SA
       → onresult (final + confidence si STRICT)
            → checkWordStream → matchFatihaWord (exact / near1)
                 → processMatchedWord
```

Fonctions critiques (ne pas casser sans tests) :  
`normalize` · `getRootSkeleton` · `matchFatihaWord` · `checkWordStream` · `startRecognition` · `loadVerse` · `processMatchedWord`

---

## 2. Findings (sévérité)

### P0 — Correctness matching

| ID | Problème | Impact Fātiḥah |
|----|----------|----------------|
| P0-1 | `checkWordStream` ne consomme que le **dernier segment** utile de façon naïve : boucle sur *tous* les tokens `heard` vs `tempIdx` **sans fenêtre glissante** ni skip d’insertions | Un mot parasite (آمين, الحمد لله fusionné) peut bloquer ou faire sauter |
| P0-2 | `isRootMatch` si `hRoot.length > 0` sans seuil de longueur relative | Racines trop courtes (`ان`) matchent trop tôt (*anʿamta*) |
| P0-3 | `dataset.ruleType = ruleType.split('-')[0]` → `madd` pour tous les madd ; `maddMissed` si `!isExact && ruleType==='madd'` | Faux positifs « Madd oublié » dès qu’une variante STT change une lettre (hamza, dagger alif) même si l’utilisateur a allongé |
| P0-4 | Interim results re-traités : même transcript partiel peut re-matcher | Double avance / skip si `processMatchedWord` n’est pas idempotent sur index déjà correct |
| P0-5 | Grammar JSGF avec HTML/arabe brut peu supportée Chrome | Bruit inoffensif, faux sentiment de contrainte lexicale |

### P1 — Couverture tajwīd (d’après REGLES-TAJWID)

| ID | Règle | État actuel | Écart |
|----|-------|-------------|-------|
| P1-1 | Madd 2/4/6 | Heuristique texte seulement | **Non mesuré** (besoin durée) |
| P1-2 | Ghunnah / ikhfāʾ / iqlāb | Aucune détection audio | Invisible au STT |
| P1-3 | Qalqalah | Aucune | Invisible |
| P1-4 | Iẓhār نْع dans *anʿamta* | Tolérance partielle `ان`/`انعم` | Trop permissive (valide trop tôt) |
| P1-5 | Madd lāzim *aḍ-ḍāllīn* | Tolérance `الدال`/`الضال` | Peut valider sans 6 temps ni ḍād correct |
| P1-6 | ص vs س (*ṣirāṭ*) | Dépend du moteur STT | Risque de validation avec sīn (sens altéré) |
| P1-7 | Lām shamsiyya / hamzat waṣl | `normalize` les retire / unifie | OK pour match lexical ; pas de feedback pédagogique |
| P1-8 | Panel live assistant | `display:none !important` | Feedback « Cible/Vous dites » invisible en prod |

### P2 — Robustesse plateforme

| ID | Problème |
|----|----------|
| P2-1 | Web Speech = cloud vendor (Chrome) ; qualité `ar-SA` variable, offline fragile |
| P2-2 | Safari vs Chromium : comportements `continuous` / `onend` différents |
| P2-3 | HTTPS obligatoire hors localhost |
| P2-4 | Pas de corpus de régression (pas de tests unitaires sur `normalize`/`checkWordStream`) |
| P2-5 | `normalize` : `ة→ه`, retrait اوي dans skeleton → utile mais masque erreurs de madd |

---

## 3. Matrice Fātiḥah × règles × stratégie STT

| Āyah | Mot / zone | Règle (REGLES-TAJWID) | Couche A (texte) | Couche B (audio) |
|------|------------|------------------------|------------------|------------------|
| 1:1 | الله / الرحمن | tafkhīm lām, assimilation ر | aliases STT | optionnel |
| 1:2 | العالمين | madd pause / munfaṣil | exact+root | durée ≥2 |
| 1:5 | إياك | shadda ي | refuse mono-yā court | — |
| 1:5 | نستعين | madd final | variants | durée |
| 1:6 | الصراط | ṣād lourde | **deny-list** سراط si confiance | formant emphatique |
| 1:7 | أنعمت | iẓhār نْع | exiger ≥ `انعم` pas `ان` seul | — |
| 1:7 | الضالين | madd lāzim 6 | exiger racine ضال + ل | **durée ~6 beats** |

---

## 4. Plan d’amélioration (par phases)

### Phase 0 — Isolation Fātiḥah (fait)

- `FATIHA_ONLY` : boot sur sourate 1 seulement, header ayah 1–7, import/browser/daily coupés.
- Objectif : surface de test = ~7 āyāt, vocabulaire fermé.

### Phase 1.5 → 1.6 — Mode `balanced` (ship)

Le mode `strict` (finals only + confidence ≥ 0.72) **cassait** la validation : Chrome renvoie souvent `confidence=0` et peu de `isFinal`.

`STT_MODE = 'balanced'` :
- match interim + final
- aliases STT courants
- edit distance 1–2 selon longueur
- squelette seulement si longueur ≥ 70 % de la cible
- forbid confusions ص/س ض/ظ
- fingerprint uniquement après succès

**API performante ?** Utile pour la couche professeur (Whisper/Groq/NeMo Coran + GOP), pas obligatoire pour revalider le tracking. Brancher une API = prochaine étape si balanced reste insuffisant.

### Phase 2 — Feedback tajwīd textuel honnête

1. Séparer **validation lexicale** (vert) et **alerte règle** (orange) : ne plus appeler « Madd oublié » sur `!isExact`.
2. `maddMissed` seulement si :  
   - match lexical OK **et**  
   - durée audio du segment < seuil (phase 3) **ou**  
   - utilisateur clique « j’ai fini » sans allongement détecté.
3. Enrichir modales règles avec le contenu de `REGLES-TAJWID.md` (tags iqlāb distincts, iẓhār, etc.).
4. Corriger mapping `openTajweedModal` : `iqlab` ≠ `idgham`, `ham_wasl` ≠ `madd-tabii`.

### Phase 3 — Couche audio (rendre les règles « infaillibles »)

Web Speech reste le **tracker de position**. L’audio juge le tajwīd.

| Capteur | Implémentation proposée | Règles ciblées |
|---------|-------------------------|----------------|
| Alignement temporel mot | VAD + découpe sur avance `currentIdx` (timestamps MediaRecorder / AudioWorklet) | toutes |
| Durée voyelle longue | énergie + pitch continuity sur fenêtre du mot | madd 2/4/6 |
| Nasalité | ratio bande basse / formants (proxy) ou modèle léger ONNX | ghunnah, ikhfāʾ |
| Burst qalqalah | détection transient en fin de plosive | ق ط ب ج د |

Pistes open-source (GitHub, recherche agent-reach) :

- [Hetchy/Quranic-Phonemizer](https://github.com/Hetchy/Quranic-Phonemizer) — cibles phonétiques IPA pour scoring.
- [malayyoub/Ahkam-Al-Tajweed](https://github.com/malayyoub/Ahkam-Al-Tajweed) — DL règles de base (réf. papers).
- [tarekeldeeb/tajweed-embeddings](https://github.com/tarekeldeeb/tajweed-embeddings) — embeddings récitation.
- [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) — ground truth annotations caractères.

Contrainte auteur : **pas de Whisper/Firebase en prod legacy** tant que non demandé. Préférer Worklet local ou API optionnelle derrière flag.

### Phase 4 — Remplacement STT optionnel (si plafond Web Speech)

Ordre de préférence produit :

1. Garder Web Speech + lexique Fātiḥah (coût 0).  
2. Si échec mobile : **Whisper.cpp / WASM** ou API Whisper **uniquement** sur Fātiḥah (7 phrases), pas tout le Coran.  
3. Modèle ASR Coran fine-tuné (plus tard, hors monolite).

---

## 5. Spécification cible `matchFatihaWord` (contrat)

```text
entrée: heardToken, expectedEntry { ar, aliases[], minRootLen, forbid[], rules[] }
sortie: { ok: boolean, reason: 'exact'|'alias'|'root'|'liaison'|'reject', warnings: RuleWarning[] }

reject si:
  - normalize(heard) ∈ forbid
  - rootLen < minRootLen
  - confusable pair (س/ص, د/ض, ظ/ض) sans alias explicite

warnings (non bloquants phase 1):
  - MADD_DURATION_UNKNOWN
  - GHUNNAH_UNCHECKED
```

Les `warnings` deviennent bloquants en phase 3 quand le capteur audio est fiable.

---

## 6. Plan de tests manuels (Fātiḥah)

- [ ] Charger l’app : header = الفاتحة + 1…7 uniquement ; pas de 112/113/114.  
- [ ] Réciter 1:1 lentement → tous les mots passent.  
- [ ] Dire seulement « ان » sur *anʿamta* → **ne doit plus** valider (après phase 1).  
- [ ] Dire « سراط » → warning / refus (phase 1).  
- [ ] Allonger *ḍāllīn* ~6 temps → pass lexical ; (phase 3) pass durée.  
- [ ] Couper le micro mid-verse → `onend` relance sans double skip.  
- [ ] Rapport technique JSON contient expected/heard/matches utiles.

---

## 7. Roadmap fichiers (respect règle ≤3 fichiers / PR)

| PR | Fichiers | Contenu |
|----|----------|---------|
| A (cette session) | `public/index.html`, `docs/REGLES-TAJWID.md`, `docs/AUDIT-STT.md` | Focus Fātiḥah + docs |
| B | `public/index.html` seul | Lexique + match fenêtre + tests manuels |
| C | `public/index.html` | Modales règles + assistant visible |
| D | `public/index.html` (+ flag) | Durée madd AudioWorklet |

---

## 8. Définition de « infaillible » (acceptation)

Pour Al-Fātiḥah en Ḥafṣ :

1. **Lexical** : 100 % des mots validés ssi la chaîne phonétique textuelle est dans l’espace d’aliases ; 0 validation sur confusions de sens listées.  
2. **Tajwīd critique** : madd lāzim 1:7 et iẓhār *anʿamta* ne valident pas en sous-spécification.  
3. **Tajwīd prosodique** (phase 3) : madd / ghunnah score ≥ seuil sur enregistrements de référence (3 récitateurs) avec F1 ≥ 0.9 sur labels `cpfair`/`quran.com`.

Sans la couche B, ne **pas** communiquer « correction tajwīd parfaite » — seulement « suivi de récitation assisté ».
