# TAJWID — Next.js PWA

Apprentissage du Tajwid avec reconnaissance vocale (Web Speech), mode Duo P2P, et installation PWA.

Production : déployé via Vercel (app Next.js, Root Directory = racine du repo).

## Lancement local

```bash
npm install
npm run dev
```

Ou double-cliquez `run.command`.

Ouvrez [http://localhost:3000](http://localhost:3000).

## Fonctionnalités V1

- Versets Tajwid colorés (API Quran.com)
- Feedback vocal en direct (Web Speech API — Chrome / Safari)
- Favoris & versets complétés (`localStorage`)
- i18n FR / EN / RU
- Mode Duo avec code de salle (PeerJS)
- Installable (PWA : manifest + service worker)

## Legacy

L’ancien monolite HTML est archivé dans `old/legacy-spa/`.
Le serveur Python `server.py` n’est plus requis pour l’app.
