# TAJWID — Contexte agent

## Source de vérité

- **Production** = SPA legacy [`public/index.html`](public/index.html)
- Déploiement Vercel : static / rewrite vers `index.html` (ne pas changer sans demande explicite)
- **`src/`** = code Next.js **non servi** en prod actuellement

## Stabilisation (branche `stabilize/legacy-prod`)

Correctifs factuels uniquement : bouton téléchargement après verset, `server.py` → `public/index.html`, docs alignées.

## Règles projet (rappel)

Pas de refactor large, pas de mise à jour de deps, pas de config build/Vercel sans validation. Max 3 fichiers par étape.
