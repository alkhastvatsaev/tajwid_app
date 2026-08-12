# Règles de Tajwīd — Référence complète (Tilmidh app)

> Document de connaissance pour l’app **Tilmidh**.  
> Riwāya cible : **Ḥafṣ ʿan ʿĀṣim**.  
> Mode produit actuel : **focus Al-Fātiḥah** (`FATIHA_ONLY` dans `public/index.html`).  
> Recherche : agent-reach (**GitHub `gh`** + **Jina Reader** / Wikipedia / READMEs repos) — août 2026.

---

## 1. Définition

Le *tajwīd* (تجويد) est l’ensemble des règles qui donnent à chaque lettre coranique **son droit** (makhraj + ṣifa) et appliquent les méthodes traditionnelles de récitation (*qirāʾāt*). Étymologie : *jawwada* = améliorer / rendre excellent.

Obligation religieuse (résumé des sources) :

- Connaissance des règles = *farḍ kifāya* (devoir communautaire).
- Réciter **Al-Fātiḥah** correctement = souvent traité comme *farḍ ʿayn* (obligation individuelle) même sans connaître les noms techniques des règles.
- Erreur qui **change le sens** ou la grammaire = blâmable / péché selon les avis cités.

Verset pivot : 73:4 — réciter le Coran *en tartīl* (mesuré, précis).

---

## 2. Fondations phonétiques

### 2.1 Makhārij al-ḥurūf (points d’articulation)

17 points d’émission classiques (gorge, langue, lèvres, nez, cavité orale pour les lettres de *madd*).

### 2.2 Ṣifāt al-ḥurūf (caractéristiques)

Attributs avec opposés (ex. shidda / rakhāwa) et attributs isolés (ex. *ṣafīr*).

### 2.3 Tafkhīm / Tarqīq (lourd / léger)

| Type | Lettres / cas | Effet |
|------|----------------|-------|
| *Mufakhkham* (toujours lourdes) | خ ص ض ط ظ غ ق | Pharyngalisation / vélarisation |
| *Rāʾ* | lourde avec fatḥa/ḍamma ; légère avec kasra ; règles de sukūn selon voyelle précédente | Variable |
| *Lām* dans الله | lourde sauf si voyelle précédente = kasra (ex. *bismillāh*) | Variable |
| Autres | *muraqqaq* (légères) | Articulation « normale » |

---

## 3. Madd (prolongation)

Une voyelle courte suivie d’une lettre de madd (ا و ي) → **2 temps** (*madd ṭabīʿī*).

| Règle | Conditions | Durée typique (Ḥafṣ) | Tag Quran.com / cpfair |
|-------|------------|----------------------|-------------------------|
| Madd ṭabīʿī | ا و ي après voyelle homogène | 2 | `madda_normal` / `madd_2` |
| Madd munfaṣil | Hamza dans le **mot suivant** | 4–5 | `madda_permissible` / `madd_munfasil` |
| Madd muttaṣil | Hamza dans le **même mot** | 4–5 | `madda_necessary` / `madd_muttasil` |
| Madd lāzim | Sukūn originel / shadda après madd | **6** | `madda_compulsory` / `madda_long` / `madd_6` |
| Madd ʿāriḍ / līn (pause) | En fin de verset / waqf | 2 / 4 / 6 (cohérent) | `madd_246` |

**Al-Fātiḥah** : fins de versets souvent en madd de pause ; 1:7 contient un madd lāzim (الضَّالِّين) — 6 temps sur la shadda.

---

## 4. Nūn sākina & Tanwīn (4 règles)

Quand نْ ou tanwīn est suivi d’une lettre :

| Règle | Lettres suivantes | Phonétique | Tag |
|-------|-------------------|------------|-----|
| **Iẓhār** | ء ه ع ح غ خ (lettres de gorge) | ن clairement, **sans** ghunnah | `izhar` |
| **Idghām avec ghunnah** | ي ن م و | Fusion + nasalisation ~2 temps | `idgham_with_ghunnah` |
| **Idghām sans ghunnah** | ل ر | Fusion complète, pas de nez | `idgham_without_ghunnah` |
| **Iqlāb** | ب | ن → م (imparfait) + ghunnah | `iqlab` |
| **Ikhfāʾ** | les 15 autres lettres | ن « caché » (~ŋ) + ghunnah | `ikhfa` |

Notes importantes :

- Idghām **entre deux mots** seulement (pas intra-mot).
- Iqlāb souvent coloré comme idghām dans certains mushafs / UIs (l’app legacy le regroupait parfois — à corriger).

---

## 5. Mīm sākina

| Règle | Condition | Effet |
|-------|-----------|-------|
| Idghām shafawī | مْ + م | Fusion + ghunnah |
| Ikhfāʾ shafawī | مْ + ب | Lèvres pas pleinement fermées + ghunnah |
| Iẓhār shafawī | مْ + autre | Clarification |

Tags : `idgham_shafawi`, `ikhfa_shafawi`.

---

## 6. Ghunnah

Nasalisation d’environ **2 temps** sur :

- نّ et مّ (shadda)
- et pendant idghām (ي ن م و), iqlāb, ikhfāʾ

Tag : `ghunnah`.

---

## 7. Qalqalah (rebond)

Lettres : **ق ط ب ج د** (مnemonic classique *قطب جد*).

Léger « bounce » / schwa réduit quand la lettre est sākina (sukūn, fin de mot, parfois shadda en waqf).

| Niveau | Cas |
|--------|-----|
| Ṣughrā | Milieu de mot / liaison |
| Wusṭā | Fin de mot sans shadda |
| Kubrā | Fin de mot + shadda |

Tag : `qalqalah`. Phonémiseur : `Q` / `QQ`.

---

## 8. Hamzat al-waṣl & Lām shamsiyya

| Règle | Effet | Tag |
|-------|-------|-----|
| Hamzat al-waṣl | ٱ silencieuse en liaison ; vocalisée en début d’énoncé | `ham_wasl` / `hamzat_wasl` |
| Lām shamsiyya | ل de ال assimilée devant lettres solaires | `laam_shamsiyah` / `lam_shamsiyyah` |
| Silent | Lettres non prononcées (marqueurs orthographiques) | `silent` |

**Al-Fātiḥah** : très fréquents (`ٱ`, `ال` + ر / ص / د…).

---

## 9. Waqf (pause)

- Dernière ḥaraka → souvent sukūn en pause.
- ة → هْ en pause.
- Tanwīn fatḥ → souvent ا.
- Cohérence des madd de pause d’un verset à l’autre (surtout Fātiḥah).

---

## 10. Taxonomie machine (repos GitHub)

Sources principales consultées via agent-reach :

| Repo | Stars (approx.) | Utilité |
|------|-----------------|---------|
| [cpfair/quran-tajweed](https://github.com/cpfair/quran-tajweed) | ~184 | Annotations JSON + arbres de décision Ḥafṣ ; liste de règles complète |
| [quran/tajweed](https://github.com/quran/tajweed) | ~75 | Expériences highlighting mushaf |
| [Hetchy/Quranic-Phonemizer](https://github.com/Hetchy/Quranic-Phonemizer) | ~30 | G2P IPA + phonèmes tajwid (iqlab `ŋ`, idgham `ñ`/`m̃`, qalqala `Q`…) |
| [malayyoub/Ahkam-Al-Tajweed](https://github.com/malayyoub/Ahkam-Al-Tajweed) | ~8 | Détection audio DL des règles de base (papers IAJIT/ACIT) |
| [tarekeldeeb/tajweed-embeddings](https://github.com/tarekeldeeb/tajweed-embeddings) | ~4 | Embeddings tajwid-aware pour récitation |
| Quran.com API `text_uthmani_tajweed` | — | Tags HTML `<tajweed class=…>` déjà utilisés en prod |

### Mapping tags Quran.com → tokens CSS app

| Classe API | Variable CSS / `ruleType` app |
|------------|-------------------------------|
| `madda_normal` | `--madd-tabii` / `madd-tabii` |
| `madda_permissible` | `--madd-munfasil` |
| `madda_necessary` | `--madd-muttasil` |
| `madda_compulsory` / `madda_long` | `--madd-lazim` |
| `ghunnah` | `--ghunnah` |
| `idgham_with_ghunnah` | `--idgham-ghunnah` |
| `idgham_without_ghunnah` | `--idgham-no-ghunnah` |
| `ikhfa` / `ikhfa_shafawi` | `--ikhfa` |
| `iqlab` | `--iqlab` |
| `izhar` / `izhar_shafawi` | `--izhar` |
| `qalqalah` | `--qalqalah` |
| `ham_wasl` | `--ham-wasl` |
| `laam_shamsiyah` | (souvent silencieux / opacity) |

---

## 11. Cartographie Al-Fātiḥah (1:1–1:7) pour l’entraînement

Règles **observées** via `api.quran.com` `uthmani_tajweed` (échantillon) :

| Āyah | Règles présentes (tags) | Points pédagogiques STT |
|------|--------------------------|-------------------------|
| 1:1 | `ham_wasl`, `laam_shamsiyah`, `madda_normal` | *Allāh* (lām), *ar-Raḥmān* (assimilation ر), dagger alif |
| 1:2 | `ham_wasl`, `madda_normal`, `madda_permissible` | *al-ʿālamīn* (madd) |
| 1:3 | idem 1:1 | Répétition Raḥmān/Raḥīm |
| 1:4 | `madda_normal`, `ham_wasl`, `laam_shamsiyah`, `madda_permissible` | *ad-dīn* (shadda + madd) |
| 1:5 | `madda_permissible` | *nastaʿīn* (madd) ; *iyyāka* (shadda ي) |
| 1:6 | `ham_wasl`, `laam_shamsiyah`, `madda_normal`, `madda_permissible` | *aṣ-ṣirāṭ* (ṣād lourde + madd) |
| 1:7 | `madda_normal`, `ham_wasl`, **madd lāzim sur الضالين** | *anʿamta* (نْ + ع = iẓhār), *ḍāllīn* (6 temps) |

### Variantes STT fréquentes à tolérer (Fātiḥah)

| Cible normalisée | Variantes entendues (Web Speech) | Règle liée |
|------------------|-----------------------------------|------------|
| الحمد | الحمدلله (fusion), حمد | liaison ال |
| اياك / اياك | اياك، إياك | hamza |
| انعمت | ان، انعم، انعمتا | iẓhār نْع — **déjà toléré partiellement** |
| الصراط / صراط | سراط، صراط | ṣād vs sīn (sens !) |
| الضالين | الدال، الضال، الظالين | madd lāzim + ḍād — **déjà toléré partiellement** |
| نستعين | نستعين، نستعينو | madd final |
| عليهم | عليهم، عليهيم | madd ي |

---

## 12. Ce que le STT **ne peut pas** vérifier seul

Web Speech API produit du **texte**, pas de la durée ni de la nasalisation réelle :

| Règle | Détectable par texte ? | Besoin audio |
|-------|------------------------|--------------|
| Identité des lettres (ص≠س, ض≠د) | Partiel (si STT distingue) | Fort |
| Madd 2 vs 4 vs 6 | Non (sauf heuristique longueur grapheme) | **Oui** (durée) |
| Ghunnah / ikhfāʾ qualité | Non | **Oui** (nasalité) |
| Qalqalah bounce | Non | **Oui** |
| Tafkhīm ر / ل | Rarement | **Oui** |

→ Voir [`AUDIT-STT.md`](AUDIT-STT.md) pour le plan « infaillible » à deux couches (texte + audio).

---

## 13. Sources

1. Wikipedia *Tajwid* — https://en.wikipedia.org/wiki/Tajwid  
2. cpfair/quran-tajweed README — règles + JSON annotations  
3. Hetchy/Quranic-Phonemizer — inventaire phonèmes IPA tajwid  
4. malayyoub/Ahkam-Al-Tajweed — papers détection règles  
5. Quran.com API v4 `text_uthmani_tajweed` / `uthmani_tajweed`  
6. Nelson, *The Art of Reciting the Qur’an* (citations Wikipedia)
