# Tarteel — Recherche approfondie : fonction vocale & validation d’ayah

> Document de reverse-engineering **public** (blogs Tarteel, NVIDIA, papers, Hugging Face, GitHub).  
> Outils : **agent-reach** (`gh` + Exa + Jina Reader), 2026-08-10.  
> **Important :** le code prod du matching / mistake detection de Tarteel **n’est pas open source**. Ce qui suit = tout ce qui est publiable + les clones open-source utilisables pour **copier le comportement**.

---

## 0. Verdict en 30 secondes

Tarteel ne « écoute » pas le tajweed lettre par lettre en prod (encore). Leur boucle vocale est :

```
Micro → ASR Quranique (cloud, NVIDIA NeMo/Riva) → texte arabe
      → alignement / fuzzy match vs texte canonique de l’ayah
      → UI : vert = OK, rouge = manqué/incorrect, compteur d’erreurs
```

| Couche | Prod Tarteel (déclaré) | Open source utilisable pour copier |
|--------|------------------------|-------------------------------------|
| ASR | Modèle custom Quranic Arabic, **WER ~4%**, latence **&lt;200 ms** (cible UX &lt;300 ms) | `tarteel-ai/whisper-base-ar-quran` (WER eval ~5.75%) |
| Infra | NeMo → TensorRT → **Riva** → Triton Inference Server | HF Transformers / faster-whisper / CoreML |
| Matching ayah | Moteur propriétaire + (historiquement) **Iqra fuzzy search** + Levenshtein | `SequenceMatcher` / Levenshtein + corpus Tanzil (ex. IqraAI) |
| Mistake detection | Word-level : missed / incorrect / extra | Alignement DiffLib opcodes (clone IqraAI) |
| Tajweed / tashkeel | **Pas encore** (roadmap letter-level) | NON TROUVÉ côté Tarteel public |

---

## 1. Produit : ce que fait la fonction vocale côté user

Sources : blogs Tarteel + case study NVIDIA.

### 1.1 Follow-along (localiser l’ayah)

1. L’utilisateur récite.
2. L’IA **détecte** la récitation, **localise** la sourate/ayah, **suit** automatiquement le mushaf (vert = leading edge = dernier mot reconnu).
3. Cas d’usage annoncés : mémorisation, suivi d’imam / Taraweeh, accessibilité sourds (traduction + follow-along).

### 1.2 Mistake detection (premium, roll-out 2022)

Annoncé après **~3 ans** de R&D, entraîné sur **&gt;75 000 minutes** de récitation curatée.

**Supporté (word-level) :**
- mots **manqués** (missed)
- mots **incorrects**
- mots **en trop** (extra)

**Non supporté (encore) :**
- Fatha / Damma / Kasra (voyelles)
- prononciation fine
- **règles de tajweed**

Feedback UX : highlight rouge + **vibration** ; résumé d’erreurs + liens vers passages similaires ; modes challenge.

### 1.3 Matching v4 (2020, avant mistake detection « full »)

Réécriture des algos de voice matching :
- **~98 %** accuracy matching (benchmark interne annoncé)
- quasi real-time (dépend du réseau)
- support **répétition** (re-réciter un mot/verset → l’algo s’adapte)
- support **accents** non natifs

---

## 2. Architecture prod (ce qu’ils ont publié)

### 2.1 Stack NVIDIA (source de vérité technique publique)

| Étape | Techno |
|-------|--------|
| Fine-tune / train | **NVIDIA NeMo** |
| Optim latence | **TensorRT** |
| Serving ASR | **NVIDIA Riva** sur **Triton Inference Server** |
| GPU cités | A100, V100 |

Chiffres officiels (NVIDIA customer story) :
- **WER ~4 %** sur transcription arabe coranique (SOTA annoncé)
- Feedback **live** à l’échelle
- Citation CEO Anas Abou Allaban : latency &gt; **300 ms** = UX « très pénible » ; cible produit **&lt;200 ms**

### 2.2 Chemin historique (avant Riva)

1. Essais **on-device** (frameworks mobiles) → trop orientés commandes courtes, pas production.
2. ASR généraliste → WER trop haut pour du Coran (10–15 % type conf call = inacceptable pour un texte sacré).
3. Dataset custom → fine-tune → encore trop lent / imprécis.
4. Passage NeMo + TensorRT + Riva.

### 2.3 Collecte audio live dans l’app (ML Journey Part 1)

Quand une session de récitation démarre :
- buffer audio **en mémoire**
- upload d’un chunk toutes les **~20 secondes** (assez long pour annoter plus tard, assez court pour ne pas saturer)
- stitch à la demande si l’user veut récupérer son fichier
- validation côté serveur (PyDub + serializers DRF)

→ Le micro ne sert pas qu’à l’ASR live : il **enrichit le dataset** de train en continu.

### 2.4 Ce qui n’est PAS public

- Code du **moteur de fuzzy-search Quran** (historiquement lié à **Iqra**, acquis par Tarteel)
- Code exact de l’**alignement streaming** mot-à-mot en prod
- Poids du modèle **Riva/NeMo** prod (différent des Whisper HF publics)
- Détection lettre / tajweed

---

## 3. Pipeline historique de labellisation (paper + wiki) — clé pour comprendre « bien lu ou pas »

Paper : *The Tarteel Dataset: Crowd-Sourced and Labeled Quranic Recitation* (OpenReview `TAdzPkgnnV8`).  
Wiki : `TarteelAI/tarteel-ml` → Tarteel v1 Dataset.

### 3.1 Dataset v1

- **25 000** clips, **67.39 h**, ~9.7 s/clip moyenne
- **&gt;1 200** réciteurs, 6 mois, « in the wild » (bruit réel gardé)
- Auto-évalué : **20 565** marqués corrects (**82.26 %**)
- Validation manuelle sur 100 ayahs : algo d’auto-eval ~**97 %** fiable

### 3.2 Auto-évaluation « est-ce la bonne ayah ? » (algo historique)

```
Audio
  → Google Cloud Speech-to-Text (ar-AE) + phrases Coran en contexte
  → transcript préliminaire
  → Iqra (fuzzy Quran search) → ayah candidate
  → si ayah retournée == ayah enregistrée → label CORRECT
```

Critères de rejet côté crowd verification (paper) : omission de plus d’un mot, etc.

### 3.3 Fuzzy search propriétaire (détail paper §5.2.2)

Entrée : transcript STT.  
Sortie : segment Coran (partiel / complet / multi-ayah) ou null.

Capacités :
- versets complets et **partiels**
- **versets consécutifs**
- similarité inexacte si pas d’exact match

Score similarité (déclaré) dépend de :
- longueur query
- longueur verset matché
- **distance de Levenshtein**
- constantes internes

Post-traitement label :
- ajouter **basmala** / **istiʿādha** si détectées dans l’audio

### 3.4 Évolution annotation (ML Journey Part 2)

- Crowdsource type Common Voice (Yes/No) → insuffisant pour STT / tashkeel
- Annotateurs experts (Égypte, ~50 personnes, **&gt;500 h/mois**, avec **tashkeel**)
- Outils : LabelStudio → GroundTruth+LabelStudio → **Retool**
- Manifests JSONL → **Weights & Biases** Dataset Artefacts (provenance)

Leçon clé Tarteel : **on ne Mechanical-Turk pas le Coran** ; il faut des annotateurs qui maîtrisent la récitation.

---

## 4. Assets open-source Tarteel (à copier / brancher)

### 4.1 Modèles Hugging Face (`tarteel-ai`)

| Model | Base | WER (card HF) | Notes |
|-------|------|---------------|-------|
| [`tarteel-ai/whisper-base-ar-quran`](https://huggingface.co/tarteel-ai/whisper-base-ar-quran) | Whisper Base | **5.7544** | Le plus utilisé par la communauté (~60k downloads/mois) |
| [`tarteel-ai/whisper-tiny-ar-quran`](https://huggingface.co/tarteel-ai/whisper-tiny-ar-quran) | Whisper Tiny | **7.0535** | Mobile / CoreML experiments |

Hyperparams publics (base) : lr 1e-4, batch 16×8 GPU (=128), Adam, 5000 steps, AMP, warmup 500.

**Usage minimal (comme le démo Tarteel / IqraAI) :**

```python
from transformers import pipeline
pipe = pipeline("automatic-speech-recognition", model="tarteel-ai/whisper-base-ar-quran")
out = pipe("ayah.wav", repetition_penalty=1.2, no_repeat_ngram_size=3)
text = out["text"]
```

### 4.2 Datasets HF

| Dataset | Rôle |
|---------|------|
| [`tarteel-ai/everyayah`](https://huggingface.co/datasets/tarteel-ai/everyayah) | Audio + texte diacrité, multi-réciteurs (ex. abdulsamad), licence MIT — **principal corpus train Whisper** |
| `tarteel-ai/EA-DI` / `EA-UD` | Autres corpora audio/texte |
| `tarteel-ai/quranqa` | QA sur Coran (hors vocal) |

### 4.3 Repos GitHub org `TarteelAI`

| Repo | Intérêt vocal |
|------|----------------|
| [`TarteelAI/tarteel-ml`](https://github.com/TarteelAI/tarteel-ml) (**archived**) | Preprocess, DeepSpeech CSV, seq2seq Keras expérimental, alphabet/vocab Coran |
| `TarteelAI/tnkeeh` | Normalisation / cleaning arabe |
| `TarteelAI/tkseem` | Tokenisation arabe |
| `TarteelAI/voice` | Fork React Native Voice (capture micro mobile) — **pas** le matching |
| `TarteelAI/NeMo`, `nemo2riva`, `Speech` | Forks / tooling NVIDIA (pas le modèle Quran custom documenté) |
| `TarteelAI/quranic-universal-library` | Assets Coran (pas ASR) |

Early ML (`tarteel-ml`) : scripts DeepSpeech + notebooks Keras seq2seq — **obsolète** vs stack Riva/Whisper actuelle.

---

## 5. Clone open-source du comportement « Tarteel-style » (à copier tel quel)

Repo le plus utile pour **reproduire mistake detection word-level** :

**[`AbdirahmanNomad/IqraAI`](https://github.com/AbdirahmanNomad/IqraAI)**  
ASR = Whisper Tarteel ; matching = DiffLib ; UI couleurs Tarteel.

### 5.1 Pipeline

```
audio → tarteel-ai/whisper-base-ar-quran → transcription
      → normalize_arabic (strip tashkeel)
      → find_best_verse (SequenceMatcher.ratio sur fenêtres 1–6 ayahs)
      → align_words (opcodes equal/replace/delete/insert)
      → status: correct | missed | extra
      → accuracy = correct / len(canonical_words)
```

### 5.2 Normalisation (copiable)

```python
def normalize_arabic(text: str) -> str:
    # strip tashkeel (pyarabic.strip_tashkeel ou NFD + remove Mn)
    # puis collapse whitespace
    ...
```

Sans diacritiques, le matching devient tolérant aux erreurs ASR de voyelles — **même philosophie** que TAJWID (`normalize` + squelette), mais Tarteel/IqraAI reste au niveau **mot**, pas squelette اوي.

### 5.3 Alignement (cœur « bien lu ou pas »)

`difflib.SequenceMatcher` sur listes de mots :

| Opcode | Interprétation Tarteel-style |
|--------|------------------------------|
| `equal` | **correct** (vert `#22c55e`) |
| `delete` | **missed** — dans le canon, pas récité (rouge `#ef4444`) |
| `insert` | **extra** — récité, pas dans le canon (ambre `#f59e0b`) |
| `replace` | missed (côté canon) + extra (côté récité) |

C’est exactement le modèle produit annoncé (missed / incorrect / extra), sans couche phonème/tajweed.

### 5.4 Recherche d’ayah

- Scan chapitres × versets
- Fenêtres de **1 à 6** versets (récitation continue)
- Score = `SequenceMatcher.ratio(norm_verse, norm_trans)`
- Early-exit si ratio **&gt; 0.95**

### 5.5 Anti-hallucination ASR

```python
pipe(path, repetition_penalty=1.2, no_repeat_ngram_size=3)
```

---

## 6. Autres projets liés (référence, pas Tarteel officiel)

| Projet | Lien | Apport |
|--------|------|--------|
| Tilawa (ex offline-tarteel) | [`yazinsai/tilawa`](https://github.com/yazinsai/tilawa) | Offline verse ID ; benchmarks Whisper Tarteel vs FastConformer, CTC, embeddings, LM fusion |
| QuranWhisperKit | [`iTarek/QuranWhisperKit`](https://github.com/iTarek/QuranWhisperKit) | CoreML / ANE temps réel sur modèle Tarteel |
| Ayyat / Qari | divers HF exports | Conversion CoreML, CTranslate2 INT8 |
| Paper OpenReview | `TAdzPkgnnV8` | Schema dataset + fuzzy + Google STT |

Tilawa confirme empiriquement : **ASR Quran-finetuned + matching texte** reste le chemin dominant ; alternatives (embeddings CLAP/HuBERT, fingerprinting) explorées pour offline.

---

## 7. Comment Tarteel décide « ayah bien lue » — synthèse actionnable

### Niveau 1 — Identification (quelle ayah ?)

1. ASR → chaîne de mots arabes  
2. Fuzzy match / ratio similarité vs corpus Coran fixe (6236 ayahs)  
3. Contexte session (ayah courante, navigation, répétition) pour désambiguïser  

### Niveau 2 — Validation mot-à-mot (bien / mal)

1. Normaliser (souvent **sans tashkeel** pour l’ASR match)  
2. Aligner récité ↔ canon (edit distance / SequenceMatcher)  
3. Classer chaque mot : correct / missed / incorrect / extra  
4. Score session = f(correct, erreurs)  

### Niveau 3 — Tajweed / lettres (futur annoncé)

**NON TROUVÉ** en prod documentée. Paper v1 : *« The Tarteel dataset does not contain tajweed labels »* ; roadmap : letter-level + éventuellement labels phonème.

---

## 8. Checklist « copier Tarteel » pour TAJWID

Ordre pragmatique (du plus proche du public au plus hard) :

1. **Remplacer / compléter Web Speech** par `tarteel-ai/whisper-base-ar-quran` (serveur ou WASM/CoreML) — gros gain WER Coran.
2. **Garder** un `normalize` arabe (strip diacritics + formes) — déjà dans TAJWID.
3. **Aligner** avec DiffLib/Levenshtein word-level (comme IqraAI) en plus du squelette اوي — pour missed/extra comme Tarteel.
4. **Corpus fixe** Tanzil / Quran.com Uthmani comme source de vérité (Tarteel exploite le Coran fermé = avantage vs ASR open-domain).
5. **Streaming** chunks ~100–200 ms ; latence cible &lt;300 ms (Tarteel &lt;200 ms en cloud GPU).
6. **Ne pas** prétendre détecter tajweed tant qu’on n’a pas de labels / modèle phonème — Tarteel ne le fait pas non plus en public.
7. Dataset train optionnel : `tarteel-ai/everyayah` + sessions users (chunks 20 s) si un jour fine-tune.

### Pièges (les leurs = les nôtres)

- STT généraliste (Google / Web Speech) **sans** fine-tune Coran → faux négatifs massifs.
- Overfit « verse classifier » (labels = numéro d’ayah forcé) → **pas** un vrai ASR (leur erreur ML Journey).
- Audio non standardisé (extension `.wav` mais contenu `mp4`, fichiers vides).
- Crowdsource non expert pour annotation Coran.
- WER « conf call » acceptable ≠ WER Coran.

---

## 9. Sources (URLs)

### Tarteel blogs
- https://tarteel.ai/blog/introducing-mistake-detection/
- https://tarteel.ai/blog/tarteels-ml-journey-part-1-intro-data-collection/
- https://tarteel.ai/blog/tarteels-ml-journey-part-2/
- https://tarteel.ai/blog/introducing-tarteel-version-4--faster-algorithms--quran-translations--and-more/
- https://tarteel.ai/blog/using-ai-to-access-quran-recitation/

### NVIDIA
- https://www.nvidia.com/en-us/case-studies/automating-real-time-arabic-speech-recognition/
- https://developer.nvidia.com/blog/exploring-unique-applications-of-automatic-speech-recognition-technology/
- https://blogs.nvidia.com/blog/ai-tarteel/

### Paper / dataset
- https://openreview.net/forum?id=TAdzPkgnnV8
- https://github.com/TarteelAI/tarteel-ml/wiki/Tarteel-v1-Dataset
- https://huggingface.co/tarteel-ai/whisper-base-ar-quran
- https://huggingface.co/datasets/tarteel-ai/everyayah

### Clones / benchmarks
- https://github.com/AbdirahmanNomad/IqraAI
- https://github.com/yazinsai/tilawa

### GTC (détails techniques annoncés, session Rainfocus)
- Lien cité depuis le blog mistake detection (NVIDIA GTC presentation Tarteel)

---

## 10. Légende « NON TROUVÉ »

| Question | Statut |
|----------|--------|
| Code source du matching prod Tarteel | NON TROUVÉ (propriétaire) |
| Poids modèle Riva/NeMo Quran prod | NON TROUVÉ (non publié) |
| Détection tajweed lettre-level en prod | NON TROUVÉ / annoncé futur |
| Algorithme exact des constantes Levenshtein Iqra | NON TROUVÉ (décrit qualitativement dans le paper) |
| Part 3+ ML Journey (train/deploy détaillé) | NON TROUVÉ en public au moment de cette recherche |

---

*Fin du dossier. Pour TAJWID : le chemin le plus court pour « copier » la sensation Tarteel = Whisper Tarteel HF + normalize + SequenceMatcher word-level, pas Web Speech seul.*
