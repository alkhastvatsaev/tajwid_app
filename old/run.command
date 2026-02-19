#!/bin/bash
cd "$(dirname "$0")"

# Port à utiliser
PORT=8000

echo "Vérification des dépendances..."
python3 -m pip install fastapi uvicorn --quiet

echo "Nettoyage du port $PORT..."
lsof -ti :$PORT | xargs kill -9 2>/dev/null

echo "Lancement de TAJWID-VATSAEV..."
python3 server.py &
SERVER_PID=$!

sleep 2
echo "Application prête sur http://localhost:$PORT"
open "http://localhost:$PORT"

echo "Appuyez sur Ctrl+C pour arrêter le serveur."
wait $SERVER_PID
