/**
 * POST /api/transcribe
 * Body JSON: { audioBase64, mimeType }
 * → Groq Whisper (clé côté serveur uniquement)
 */
const ALLOWED_ORIGINS = new Set([
  'https://tilmidh.app',
  'https://www.tilmidh.app',
  'https://tajwid-app-vatsaev.vercel.app',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
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

function extFromMime(mime) {
  const m = (mime || '').toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac')) return 'mp4';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  return 'webm';
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GROQ_API_KEY missing on server' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const audioBase64 = body.audioBase64;
    const mimeType = body.mimeType || 'audio/webm';
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 required' });
    }
    // ~4MB base64 safety (word clips are tiny)
    if (audioBase64.length > 5_500_000) {
      return res.status(413).json({ error: 'audio too large' });
    }

    const buf = Buffer.from(audioBase64, 'base64');
    if (!buf.length) {
      return res.status(400).json({ error: 'empty audio' });
    }

    const form = new FormData();
    const blob = new Blob([buf], { type: mimeType });
    form.append('file', blob, `clip.${extFromMime(mimeType)}`);
    form.append('model', 'whisper-large-v3');
    form.append('language', 'ar');
    form.append('response_format', 'json');
    form.append('temperature', '0');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    const raw = await groqRes.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: raw };
    }

    if (!groqRes.ok) {
      console.error('Groq STT error', groqRes.status, typeof data === 'object' ? data.error || data : raw.slice(0, 200));
      return res.status(502).json({
        error: 'groq_failed',
        detail: (data && data.error && (data.error.message || data.error)) || groqRes.statusText,
      });
    }

    return res.status(200).json({
      text: (data && data.text) || '',
      model: 'whisper-large-v3',
      engine: 'groq',
    });
  } catch (err) {
    console.error('transcribe handler', err);
    return res.status(500).json({ error: 'server_error', detail: String(err && err.message ? err.message : err) });
  }
};
