# Tilmidh — Legacy SPA (production)

Application web d’entraînement au tajwid mot à mot. **La production sert le monolite HTML** [`public/index.html`](public/index.html).

Prod : https://tilmidh.app/

## Lancement local

### Option A — serveur de diagnostic Python

```bash
python3 server.py
```

Ouvre [http://localhost:3000](http://localhost:3000) (sert `public/index.html`).  
Le endpoint `POST /log` reçoit les rapports techniques (fichier `diagnostic_report.json`).

### Option B — fichiers statiques

Servir le dossier `public/` (ou ouvrir via le déploiement Vercel).

## Fonctionnalités (prod actuelle)

- i18n FR / EN / RU (`localStorage`: `tajwid_lang`)
- Reconnaissance vocale (Web Speech API) + barre de progression de session
- Analyse live « Cible » / « Vous dites »
- Enregistrement + téléchargement de la récitation (après fin de verset)
- Rapport technique (JSON + envoi local `/log` si le serveur tourne)
- Modale d’explication des règles Tajwid
- Sélecteur de sourate + import par référence (ex. `2:255`) — label UI « IA Import », données via **api.quran.com**
- Tableau de bord (versets complétés, favoris, objectif Coran %) — `localStorage`
- Mode Duo (PeerJS, User 1 / User 2)
- Verset du jour

## Hors production

Le dossier [`src/`](src/) contient une app **Next.js** non servie par le déploiement Vercel actuel (preset static + `public/`). Ne pas confondre avec la prod.

Archives : [`old/`](old/), [`old/legacy-spa/`](old/legacy-spa/).
