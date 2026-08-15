#!/usr/bin/env node
// Contrôle complet avant déploiement. À lancer après chaque vague de pages.
//
//   node scripts/seo-check.mjs
//
// Enchaîne : contenu mince → hreflang → sitemap → dérive on-page.
// Sort en code 1 si un contrôle échoue, pour pouvoir servir de garde en CI.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAUDE_SEO = path.join(process.env.HOME, '.claude/skills/seo/bin/claude-seo');

const steps = [
  {
    name: 'Contenu mince — pages générées (seuil 400 mots)',
    run: () => exec('node', ['scripts/gen-pages.mjs', '--audit'], { cwd: ROOT }),
  },
  {
    // gen-pages ne mesure que ce qu'il génère : sans ce second contrôle, une
    // page écrite à la main peut rester à 250 mots sans que rien ne le dise.
    name: 'Contenu mince — pages publiées (seuil 400 mots)',
    run: () => exec('node', ['scripts/check-thin.mjs'], { cwd: ROOT }),
  },
  {
    name: 'Réciprocité hreflang',
    run: () => exec('node', ['scripts/fix-hreflang.mjs', '--dry'], { cwd: ROOT }),
    // Le script sort toujours en 0 ; on juge sur la sortie.
    failsIf: (out) => /à corriger/.test(out),
  },
  {
    name: 'Sitemap à jour',
    run: () => exec('node', ['scripts/gen-sitemap.mjs', '--check'], { cwd: ROOT }),
  },
  {
    name: 'Dérive on-page (claude-seo)',
    skip: !existsSync(CLAUDE_SEO),
    run: () => exec(CLAUDE_SEO, ['run', 'drift_compare.py', 'https://tilmidh.app/'], { cwd: ROOT }),
    soft: true, // la dérive informe, elle ne bloque pas
  },
];

let failed = 0;

for (const s of steps) {
  if (s.skip) {
    console.log(`— ${s.name} : ignoré (outil absent)`);
    continue;
  }
  process.stdout.write(`— ${s.name} … `);
  try {
    const { stdout } = await s.run();
    if (s.failsIf?.(stdout)) {
      console.log('ÉCART');
      console.log(stdout.trim().split('\n').map((l) => `    ${l}`).join('\n'));
      failed++;
    } else {
      console.log('ok');
    }
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
    if (s.soft) {
      console.log('signalé');
      if (out) console.log(out.split('\n').slice(0, 12).map((l) => `    ${l}`).join('\n'));
    } else {
      console.log('ÉCHEC');
      if (out) console.log(out.split('\n').map((l) => `    ${l}`).join('\n'));
      failed++;
    }
  }
}

console.log(
  failed
    ? `\n${failed} contrôle(s) en échec — ne pas déployer en l'état.`
    : '\nTous les contrôles passent. Déploiement possible.'
);
process.exitCode = failed ? 1 : 0;
