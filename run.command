#!/bin/bash
cd "$(dirname "$0")"

PORT=3000

echo "------------------------------------------"
echo "Tilmidh — Next.js PWA"
echo "------------------------------------------"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé: https://nodejs.org/"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances..."
  npm install
fi

echo "Nettoyage du port $PORT..."
lsof -ti :"$PORT" | xargs kill -9 2>/dev/null

echo "Lancement sur http://localhost:$PORT"
npm run dev -- -p "$PORT" &
DEV_SERVER_PID=$!

sleep 4
open "http://localhost:$PORT" 2>/dev/null || true

echo "Ctrl+C pour arrêter (pid $DEV_SERVER_PID)."
wait "$DEV_SERVER_PID"
