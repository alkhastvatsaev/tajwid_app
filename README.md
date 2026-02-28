# TAJWID AI - Modern Mastery Engine

Professional Quran Learning application with real-time AI feedback and Peer-to-Peer Duo mode.

## Features

- **Modern UI**: Dark mode, glassmorphism, and smooth animations using Framer Motion.
- **AI Feedback**: Real-time Arabic speech recognition using Web Speech API.
- **Tajwid Rules**: Automatic parsing and styling of Tajwid rules from Quran.com.
- **Duo Mode**: Real-time P2P audio and state synchronization using PeerJS.
- **Responsive**: Fully optimized for mobile and desktop.

## Refactored Architecture

The app has been migrated from a single-file HTML/JS with a Python backend to a modern **Next.js 15 (App Router)** stack:

- **Frontend**: React, TypeScript, Framer Motion, Lucide icons.
- **Backend API**: Next.js Server Components and API Routes.
- **State Management**: React Hooks (Custom hooks for Speech and Duo Mode).
- **Communication**: P2P (PeerJS) for the Duo Mode experience.

## Deployment

This app is ready for zero-config deployment on **Vercel**:

1. Push this code to a GitHub repository.
2. Import the project in Vercel.
3. Done!

## Development

Vous pouvez lancer l'application de deux manières :

### 1. Via le script automatique (Recommandé)

Double-cliquez sur `run.command` à la racine du projet ou lancez :

```bash
./run.command
```

Ce script s'occupe d'installer les dépendances, de libérer le port 3000 et d'ouvrir le navigateur automatiquement.

### 2. Manuellement

```bash
npm install
npm run dev
```

Puis ouvrez [http://localhost:3000](http://localhost:3000).

## Legacy Files

The original files have been moved to the `old/` directory for reference.

- `old/index.html`: Previous frontend logic.
- `old/server.py`: Former FastAPI server.
