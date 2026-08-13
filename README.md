# Tilmidh — best tajwid app for beginners

Application web d’entraînement au tajwid mot à mot.  
**Production :** https://tilmidh.app/ = monolite [`public/index.html`](public/index.html)

## Carte du repo

```text
public/          PROD — HTML/CSS/JS + fonts COLR + pages SEO
api/             Vercel serverless (log, LiveKit rooms, …)
fonts/           Sources + scripts build COLR (pas servi tel quel)
docs/            Cerveau produit (APP-MAP, fonts, SEO, …)
twa/             Android / Play (TWA)
scripts/         Outils voix / analyse
server.py        Local : sert public/ + POST /log
_archive/        Pas prod — old SPA, Next expérimental, notes
.cursor/rules/   Règles agents (COLR fonts, monolite, …)
```

## Lancement local

```bash
python3 server.py
```

→ [http://localhost:3000](http://localhost:3000) (`public/index.html`).

## Polices mushaf (base pour toutes les sourates)

- Ayah : `KFGQPC Colored` → `public/fonts/KFGQPCHAFSColored-Bold.woff2`
- Validé : `KFGQPC Validated` → `public/fonts/KFGQPCHAFSColored-ValidatedBlue.woff2`
- Règle agent : [`.cursor/rules/tajwid-colr-fonts.mdc`](.cursor/rules/tajwid-colr-fonts.mdc)

## Hors production

- [`_archive/next-experimental/`](_archive/next-experimental/) — Next.js non servi
- [`_archive/old-spa/`](_archive/old-spa/) — anciens monolites

Ne pas confondre avec la prod Vercel (`outputDirectory: public`).
