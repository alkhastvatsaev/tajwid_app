# SOLUTION — Validation vocale Tilmidh

Date : 2026-08-10  
Cible prod : `public/index.html` (SPA static Vercel)  
Périmètre : Al-Fātiḥah (`FATIHA_ONLY`)

---

## 1. Diagnostic (Phase 1)

Chaîne lue dans le code réel (lignes approximatives au moment du diagnostic) :

| Étape | Lignes | Fonction / zone |
|-------|--------|-----------------|
| Flag focus Fātiḥah | ~2553–2574 | `FATIHA_ONLY`, `assertFatihaOnly` |
| Capture micro | ~2978–2981 | `getUserMedia` dans `startRecognition` |
| AudioContext + analyser | ~3010–3017 | `audioCtx`, `analyser` (aussi aura UI) |
| MediaRecorder | ~3020–3034 | export audio (hors jugement) |
| Config SpeechRecognition | ~3039–3052 | `ar-SA`, `continuous`, `interimResults`, `maxAlternatives=3`, JSGF optionnel |
| Réception résultats | ~3056–3067 | `recognition.onresult` → transcript agrégé → `checkWordStream` |
| Relance | ~3075–3077 | `onend` → `recognition.start` si `isRecording` |
| Volume / aura | ~3105–3135 | `trackVolume` (énergie FFT, **pas** de jugement avant ce fix) |
| `normalize` | ~3143–3162 | strip HTML/harakat, unifie alifs, ة→ه |
| `getRootSkeleton` | ~3165–3168 | retire اوي, dé-double |
| Lexique / match | ~3176–3285 | `STT_MODE`, `FATIHA_LEXICON`, `matchFatihaWord`, `editDistance` |
| Avance index | ~3305–3375 | `checkWordStream` → `processMatchedWord` → `currentIdx` |
| UI assistant | ~1940–1957, ~3391–3440 | Cible / Vous dites |
| Vert UI | ~3450–3495 | `processMatchedWord` ajoute `.correct` |
| Tags tajwīd au rendu | ~2755–2791 | `box.dataset.ruleType`, `verseData` (avant fix : `{ ar }` seulement) |

**Confirmation :** la description du brief est exacte. Le verdict « vert » était un **match de dictée STT**, pas un jugement phonétique. L’analyser audio servait l’aura visuelle, pas la validation. Les oscillations strict/balanced/legacy confirment le problème D (promesse ≠ capacité).

---

## 2. Tableau des catégories (Phase 2)

| Cat. | Idée | Résout | Ne résout pas | Static Vercel | Backend / clé | Complexité | Risques |
|------|------|--------|---------------|---------------|---------------|------------|---------|
| **C1** | Produit honnête « suivi de récitation » (STT textuel assumé) | D (promesse), partiellement C (fin du mensonge) | A1 (biais STT), jugement tajwīd | Oui | Non | Faible | Toujours faux positifs STT si on prétend encore juger |
| **C2** | Juge 100 % acoustique (GOP / modèle phonème) | A/B/C/D si modèle fiable | Besoin data/modèle ; temps réel mobile difficile | Difficile (WASM lourd) ou non | Souvent oui | Très haute | Qualité, taille, latence |
| **C3** | Hybride : STT = **position** + audio = **seuils mesurables** (durée/énergie ; madd) | D (honnêteté + une vraie couche son), B (silence), partie A/T3/T5-madd | Substitution où le STT « invente » le bon mot (A1) ; la plupart des règles tajwīd | Oui (Web Audio local) | Non pour le MVP | Moyenne | Faux refus si micro faible ; faux succès STT+durée |
| **C4** | API récitation Coran / Whisper fine-tuné | Potentiellement A/B tracking + futurs scores | Dépend vendor ; pas magiquement du tajwīd | Front OK + appel HTTPS | Oui (clé, coût, latence) | Haute | Vie privée, offline, coût |

**Recalibrage seul du matching texte :** explicitement **C1** (choix d’honnêteté / UX de suivi). **Ce n’est pas une solution à D** si l’UI continue de promettre un professeur.

**Autre catégorie C5 (notée, non choisie seule) :** validation manuelle seule (bouton ✓ déjà présent) — honnête mais abandonne l’auto.

---

## 3. Décision (Phase 3)

**Choix : C3 (hybride local) + C1 (honnêteté d’affichage).**  
Catégorie déclarée : **C3**, avec reframing produit **C1**.

### Pourquoi ça échappe au balancier A/B structurellement

- On **ne** prétend plus que le STT = professeur.
- On **ajoute** une condition **indépendante du texte** : énergie vocale récente (ms voisées). Sans parole mesurable → pas d’avance (casse B-silence et une partie des hallucinations sur silence).
- Sur mots tagués **madd** (et ghunnah), le seuil de durée est **plus haut** : un match textuel avec son trop court → refus (adresse une partie de T5, sans survendre le reste du tajwīd).
- Le curseur textuel n’est plus le seul juge : même un STT « trop gentil » peut être bloqué par le gate acoustique ; même un STT « trop pointilleux » n’est plus compensé en mentant sur le tajwīd — l’UI dit **suivi + contrôle sonore basique**.

### Nouvelle promesse utilisateur

- **Oui :** suivi mot à mot de la Fātiḥah ; le micro doit vraiment produire du son ; les madd (durée) sont contrôlés grossièrement.
- **Non :** validation complète makhraj / qalqalah / ikhfāʾ / distinction ص↔س quand le STT a déjà « corrigé » le texte.

### Branchement futur (C4) sans bloquer aujourd’hui

```text
PronunciationJudge.mode = 'local-acoustic' | 'mock' | 'external'
```

- `local-acoustic` : implémenté (Web Audio).
- `mock` : accepte toujours l’acoustique (debug).
- `external` : stub ; pour activer il faudra fournir **URL endpoint + clé API** et un contrat `{audioBase64|url, expected, ruleType} → {ok, score, reasons[]}`.

**À fournir plus tard pour C4 :** clé API, endpoint HTTPS CORS, budget latence, politique privacy.

---

## 4. Ancienne promesse → nouvelle promesse

| Avant (perçu) | Après (affiché) |
|---------------|-----------------|
| « L’IA vous écoute » / analyse comme un juge tajwīd | « Suivi de récitation » |
| Vert = bien récité (tajwīd) | Vert = **dictée plausible + son suffisant** (durée) |
| Cible / Vous dites = preuve | Cible / Transcript STT + ligne **Couche : texte + durée sonore** |
| Madd oublié heuristique texte | Madd : **seuil de durée audio** (ms), dit explicitement |

---

## 5. Fichiers modifiés

| Fichier | Résumé |
|---------|--------|
| `SOLUTION.md` | Ce document (mission). |
| `public/index.html` | `PronunciationJudge` + ring buffer voisé dans `trackVolume` ; gate acoustique dans `checkWordStream` ; `verseData[].ruleType` ; i18n / labels honnêtes ; badge couche dans `#live-assistant` ; mode `mock`/`external` stub. |

Aucune nouvelle dépendance npm. Pas de rename.

---

## 6. Prédictions T1–T7

| Test | Prédiction | Pourquoi |
|------|------------|----------|
| **T1** récitation correcte posée | **PASS** (attendu ≥90 % si micro OK, Chrome, débit lent) | STT balanced + seuils durée calibrés pour parole réelle ; hypothèse environnement calme |
| **T2** autre mot arabe | **PARTIEL** | Si le STT transcrit le vrai autre mot → FAIL validation (match rate). Si le STT **réécrit** vers le mot cible malgré la substitution → peut PASS à tort ; le gate durée ne détecte pas le *mauvais* phonème |
| **T3** moitié de mot | **PASS** (en général) | `too_short` / forbid + durée min souvent non atteinte |
| **T4** silence 10 s | **PASS** | `voicedMs` sous seuil → gate acoustique refuse même si bruit STT rare |
| **T5** faute tajwīd, même lexique (madd écourté) | **PARTIEL** | Mots **avec** tag madd : refus si durée courte (**PASS** partiel). Autres règles (makhraj, qalqalah…) : **FAIL** à détecter — non survendu |
| **T6** même mot 2× | **PASS** | `.correct` + fingerprint post-succès + index avancé |
| **T7** 9 features | **PASS** | Changements localisés pipeline vocal / i18n assistant ; Duo/import/stats/download non refactorisés |

Survente = échec : T2 et T5 non-madd sont **explicitement non garantis**.

---

## 7. Limites connues et hypothèses

1. **Hypothèse navigateur :** Chrome desktop/Android avec Web Speech `ar-SA` (Safari moins fiable — non re-testé ici).
2. **Hypothèse micro :** niveau entrée « conversation » ; micro très bas → faux négatifs acoustiques.
3. **Non vérifié en runtime dans cette session :** exécution réelle T1–T7 (prédictions seulement).
4. **A1 non éliminé :** STT qui invente le bon mot + utilisateur qui produit assez de son (même faux) peut encore valider.
5. **Pas de GOP / pas de modèle phonème** dans ce livrable.
6. **`external` non câblé** à un vendor ; stub uniquement.
7. **Seuils ms** empiriques (commentés dans le code), pas calibrés sur corpus annoté.
8. **FATIHA_ONLY** reste `true` ; hors scope de cette mission de le rouvrir.
9. Le bouton validation manuelle reste une échappatoire honnête si le STT échoue.
