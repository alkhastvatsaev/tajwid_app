---
description: Comment déployer vos projets sur Vercel (Recommandé pour votre CV)
---

Voici les étapes pour déployer ce projet (et les futurs) de la manière la plus simple et professionnelle possible.

### 1. Préparer votre repository GitHub

Assurez-vous que votre code est sur GitHub :

1. Créez un nouveau repository (vide) sur [github.com/new](https://github.com/new).
2. Liez votre dossier local au repo (remplacez l'URL par la vôtre) :
   ```bash
   git init
   git add .
   git commit -m "feat: initial modern refactor"
   git branch -M main
   git remote add origin https://github.com/VOTRE_NOM/NOM_DU_PROJET.git
   git push -u origin main
   ```

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous avec GitHub.
2. Cliquez sur **"Add New"** > **"Project"**.
3. Importez votre repository GitHub.
4. Cliquez sur **"Deploy"**.

### 3. Pourquoi c'est bon pour votre CV ?

- **CI/CD automatique** : Grâce au fichier `.github/workflows/main.yml` que j'ai ajouté, chaque commit sera vérifié automatiquement. Si vous cassez quelque chose, GitHub vous le dira (icône rouge). Un recruteur verra que vous travaillez "proprement".
- **URL Professionnelle** : Vercel vous donne une URL propre (ex: `tajwid-app.vercel.app`) que vous pouvez mettre directement sur votre profil LinkedIn.
- **Preview Deployments** : Si vous créez une "Pull Request", Vercel créera une version de test du site séparée de la version principale. C'est une compétence très recherchée en entreprise.

### 4. Conseil Bonus pour le CV

Sur votre CV, ne mettez pas seulement "Développeur React". Mettez :

> "Déployé en environnement de production via Vercel avec pipeline CI/CD GitHub Actions pour garantir la qualité du code."
