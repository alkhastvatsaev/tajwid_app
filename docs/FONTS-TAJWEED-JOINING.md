# Fonts arabes, jointure & tajweed coloré (Tilmidh)

Recherche (GitHub + OpenType) — août 2026.

## Ce n’est pas « la jointure » qu’on colore

En arabe, les lettres ne sont **pas** collées par un trait séparé qu’on pourrait peindre en CSS.

Le moteur (HarfBuzz / Core Text / DirectWrite) :

1. Lit le `Joining_Type` Unicode de chaque caractère
2. Choisit une forme contextuelle via GSUB : `isol` · `init` · `medi` · `fina`
3. Applique ligatures obligatoires `rlig` (ex. لام+ألف)
4. Pose les marques (harakāt) via GPOS `mark`

Références :

- [Microsoft — Arabic script development](https://learn.microsoft.com/en-us/typography/script-development/arabic)
- [n8willis/opentype-shaping-documents — Arabic](https://github.com/n8willis/opentype-shaping-documents/blob/master/opentype-shaping-arabic.md)

Colorer un `<span>` au milieu d’un mot **casse** cette pipeline (Safari → barre teal sur `ـٰ`).

## Solution police colorée : COLR + CPAL

Une police **colorée OpenType** embarque les couleurs **dans le glyphe** (tables `COLR` + `CPAL`).

- Le shaping reste une seule run (jointures OK)
- Safari / Chrome peignent le glyphe déjà coloré — pas de CSS mid-mot
- C’est exactement ce que font les mushafs tajweed numériques

### Fonts récupérées / analysées

| Fichier | Source | Jointure GSUB | Couleur |
|---------|--------|---------------|---------|
| `KFGQPCHAFSColored-Bold.ttf` | [AbuYusof/…Colored-By-Tajweed-Ruls](https://github.com/AbuYusof/Quran-Fonts-HAFS-Uthmanic-Colored-By-Tajweed-Ruls) | `init medi fina rlig calt` | **COLR+CPAL** (22 couleurs, 327 glyphes colorés) |
| `AmiriQuran-Regular.ttf` | Google Fonts / alif-type | `init medi fina rlig mark…` | mono (base idéale pour fork Tilmidh) |
| `NotoNaskhArabic-Regular.ttf` | notofonts | `init medi fina rlig…` | mono |

Palette KFGQPC (extrait) : noir, gris, rouge, orange, jaune, vert, cyan `#00DDFF`, bleu, violet… — mappée sur des variantes de glyphes (ex. `u0670` dagger → colorID 19).

Copies locales : `fonts/vendor/` · web : `public/fonts/KFGQPCHAFSColored-Bold.woff2`

## Plan Tilmidh (notre propre `.ttf`)

On **ne redessine pas** l’alphabet. On fork une police coranique open (Amiri Quran) et on ajoute COLR :

1. Base : Amiri Quran (licence OFL)
2. Script `fonts/scripts/build_tilmidh_colr.py` → `fonts/tilmidh/TilmidhTajweed-Regular.ttf`
3. Palette Tilmidh alignée sur l’app (`--madd-tabii`, `--ghunnah`, …)
4. Layers colorés sur : `u0670` (dagger), variantes madd, éventuellement classes ghunnah
5. Servir en `woff2` depuis `public/fonts/`
6. Dans `index.html` : texte **sans** spans colorés mid-mot ; la police peint le tajweed

Limite : une COLR « statique » colore des **types** de glyphes (tout dagger, certains calt), pas un span Quran.com arbitraire. Pour Fātiḥah + règles fréquentes, c’est suffisant. Pour un mushaf 100 % dynamique, il faudra soit plusieurs palettes, soit des glyphes PUA par règle.

## Rôles en prod (ship/colr-tajweed-font)

| Asset | Rôle | Licence |
|-------|------|---------|
| `public/fonts/KFGQPCHAFSColored-Bold.woff2` | Encre mushaf (primaire) | GPL-3 → `LICENSE-KFGQPC-GPL3.txt` |
| `public/fonts/TilmidhTajweed-Regular.ttf` | Fallback COLR (Amiri Quran + marks) | OFL + layers Tilmidh |
| Quran.com tags | Points madd + `data-rule-full` + modale | — |

Démo A/B : `/fonts/research/colr-demo.html`.

Build fallback : `.venv/bin/python fonts/scripts/build_tilmidh_colr.py`.
