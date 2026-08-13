/**
 * POST /api/log — diagnostic JSON (Vercel serverless)
 * Rewrite prod : /log → /api/log
 */
const ALLOWED_ORIGINS = new Set([
  'https://tilmidh.app',
  'https://www.tilmidh.app',
  'https://tajwid-app-vatsaev.vercel.app',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    console.log('[tilmidh/log]', JSON.stringify(body).slice(0, 4000));
    return res.status(200).json({ status: 'success', received: true });
  } catch (err) {
    console.error('[tilmidh/log]', err);
    return res.status(500).json({ status: 'error', message: String(err.message || err) });
  }
};
