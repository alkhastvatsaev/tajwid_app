import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const exec = promisify(execFile);

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function shapeSvg(type, accent) {
  const shapes = {
    circle: `<circle cx="980" cy="110" r="210" fill="${accent}" opacity="0.28"/>`,
    octagon: `<polygon points="820,30 1120,30 1170,210 1020,380 760,380 710,210" fill="${accent}" opacity="0.28"/>`,
    diamond: `<polygon points="980,20 1160,200 980,380 800,200" fill="${accent}" opacity="0.28"/>`,
    arc: `<path d="M 700 400 A 300 300 0 0 1 1140 60" fill="none" stroke="${accent}" stroke-width="110" opacity="0.24" stroke-linecap="round"/>`,
    bars: `<rect x="890" y="50" width="28" height="300" fill="${accent}" opacity="0.3" rx="6"/><rect x="960" y="90" width="28" height="220" fill="${accent}" opacity="0.22" rx="6"/><rect x="1030" y="130" width="28" height="140" fill="${accent}" opacity="0.16" rx="6"/>`,
  };
  return shapes[type] || shapes.circle;
}

export function buildSvg({ arabic, shape, title, fontPath, palette }) {
  const arSize = arabic.length > 6 ? 80 : arabic.length > 4 ? 88 : 120;
  const arabicEl = arabic
    ? `<text x="600" y="300" class="ar" font-size="${arSize}" text-anchor="middle" direction="rtl" unicode-bidi="embed">${esc(arabic)}</text>`
    : `<rect x="520" y="180" width="160" height="160" fill="none" stroke="${palette.ink}" stroke-width="8" rx="24" opacity="0.85"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @font-face { font-family: TilmidhArabic; src: url('file://${fontPath}'); }
      .ar { font-family: TilmidhArabic; fill: ${palette.ink}; }
      .latin { font-family: Arial, Helvetica, sans-serif; fill: ${palette.ink}; font-weight: 700; }
      .brand { font-family: Arial, Helvetica, sans-serif; fill: ${palette.ink}; font-weight: 600; opacity: 0.92; }
    </style>
  </defs>
  <rect width="1200" height="630" fill="${palette.bg}"/>
  ${shapeSvg(shape, palette.accent)}
  <rect x="72" y="520" width="180" height="6" fill="${palette.accent}" opacity="0.35" rx="3"/>
  <text x="72" y="56" class="brand" font-size="26">Tilmidh</text>
  ${arabicEl}
  <text x="600" y="500" class="latin" font-size="40" text-anchor="middle">${esc(title)}</text>
</svg>`;
}

export async function renderCard({ arabic, shape, title, fontPath, palette, ogOut, pageOut, tmpSvg }) {
  const { writeFile, mkdir } = await import('node:fs/promises');
  const svg = buildSvg({ arabic, shape, title, fontPath, palette });
  await writeFile(tmpSvg, svg, 'utf8');
  await mkdir(path.dirname(ogOut), { recursive: true });
  await mkdir(path.dirname(pageOut), { recursive: true });
  await exec('rsvg-convert', [tmpSvg, '-o', ogOut, '-w', '1200', '-h', '630']);
  await exec('magick', [ogOut, '-resize', '960x540', '-quality', '82', pageOut]);
}
