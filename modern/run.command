#!/bin/bash

# Se déplacer dans le dossier du script
cd "$(dirname "$0")"

# Port par défaut de Next.js
PORT=3000

echo "------------------------------------------"
echo "🚀 Démarrage de TAJWID Modern App..."
echo "------------------------------------------"

# Vérification de Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé."
    echo "Veuillez l'installer sur https://nodejs.org/"
    exit 1
fi

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances (cela peut prendre une minute)..."
    npm install
fi

# Nettoyage du port
echo "⚡ Nettoyage du port $PORT..."
lsof -ti :$PORT | xargs kill -9 2>/dev/null

# Lancement de l'application
echo "🌐 Lancement du serveur de développement..."
npm run dev -- -p $PORT &
DEV_SERVER_PID=$!

# Attendre que le serveur soit prêt
echo "⏳ Attente du démarrage..."
sleep 5

# Ouverture du navigateur
open "http://localhost:$PORT"

echo "------------------------------------------"
echo "✅ Application disponible sur http://localhost:$PORT"
echo "💡 Appuyez sur Ctrl+C dans ce terminal pour arrêter."
echo "------------------------------------------"

# Garder le script actif pour le serveur
wait $DEV_SERVER_PID
