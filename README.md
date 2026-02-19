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

```bash
npm install
npm run dev
```

## Legacy Files

The original files have been moved to the `old/` directory for reference.

- `old/index.html`: Previous frontend logic.
- `old/server.py`: Former FastAPI server.
