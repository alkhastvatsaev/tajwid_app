/**
 * POST /api/save-recitation
 * Body JSON: { audioBase64, mimeType, meta }
 * → Vercel Blob (privé) sous recitations/fatiha/
 */
function setCors(req, res) {
  // Opt-in dataset POST, pas de cookies : * évite les échecs preview / tunnel / localhost.
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
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

function stripDataUrl(b64) {
  if (!b64 || typeof b64 !== 'string') return '';
  const i = b64.indexOf(',');
  return b64.startsWith('data:') && i >= 0 ? b64.slice(i + 1) : b64;
}

async function putToVercelBlob(pathname, buffer, contentType, token) {
  const url = new URL('https://vercel.com/api/blob');
  url.searchParams.set('pathname', pathname);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-version': '12',
      'x-vercel-blob-access': 'private',
      'x-add-random-suffix': '1',
      'x-content-type': contentType || 'application/octet-stream',
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || text.slice(0, 200);
    throw new Error(`blob_put_failed:${res.status}:${msg}`);
  }
  return data;
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN missing on server' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const audioBase64 = stripDataUrl(body.audioBase64);
    const mimeType = body.mimeType || 'audio/webm';
    const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 required' });
    }
    if (audioBase64.length > 10_000_000) {
      return res.status(413).json({ error: 'audio too large' });
    }

    const buf = Buffer.from(audioBase64, 'base64');
    if (!buf.length) {
      return res.status(400).json({ error: 'empty audio' });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = Math.random().toString(36).slice(2, 8);
    const ext = extFromMime(mimeType);
    const basePath = `recitations/fatiha/${stamp}-${id}`;

    const audioBlob = await putToVercelBlob(`${basePath}.${ext}`, buf, mimeType, token);
    const metaPayload = {
      ...meta,
      consent: true,
      savedAt: new Date().toISOString(),
      audioPathname: audioBlob.pathname || `${basePath}.${ext}`,
      audioUrl: audioBlob.url || null,
    };
    const metaBuf = Buffer.from(JSON.stringify(metaPayload, null, 2), 'utf8');
    const metaBlob = await putToVercelBlob(`${basePath}.json`, metaBuf, 'application/json', token);

    return res.status(200).json({
      ok: true,
      audioUrl: audioBlob.url || null,
      metaUrl: metaBlob.url || null,
      pathname: audioBlob.pathname || `${basePath}.${ext}`,
    });
  } catch (err) {
    console.error('save-recitation', err);
    return res.status(500).json({
      error: 'server_error',
      detail: String(err && err.message ? err.message : err),
    });
  }
};
