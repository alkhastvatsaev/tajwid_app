/**
 * POST /api/audit — élève envoie une récitation (audio + email + genre)
 * GET  /api/audit?key= — liste dispatch
 * GET  /api/audit?key=&id=&file=audio — stream audio
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

const INDEX_PATH = 'audits/index.json';

function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return /^https:\/\/tilmidh(-[a-z0-9]+)?-alkhastvatsaevs-projects\.vercel\.app$/.test(origin);
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (originAllowed(origin) && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-audit-key');
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

function dispatchSecret() {
  if (process.env.AUDIT_DISPATCH_SECRET) return process.env.AUDIT_DISPATCH_SECRET;
  if (process.env.VERCEL_ENV === 'production') return '';
  return 'tilmidh-local';
}

function requestKey(req) {
  const q = req.query || {};
  return String(q.key || req.headers['x-audit-key'] || '').trim();
}

function keyOk(req) {
  const secret = dispatchSecret();
  if (!secret) return false;
  return requestKey(req) === secret;
}

async function putToVercelBlob(pathname, buffer, contentType, token, overwrite) {
  const url = new URL('https://vercel.com/api/blob');
  url.searchParams.set('pathname', pathname);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-version': '12',
      'x-vercel-blob-access': 'private',
      'x-add-random-suffix': overwrite ? '0' : '1',
      'x-allow-overwrite': overwrite ? '1' : '0',
      'x-content-type': contentType || 'application/octet-stream',
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && (data.error?.message || data.error || data.message)) || text.slice(0, 200);
    throw new Error('blob_put_failed:' + res.status + ':' + msg);
  }
  return data;
}

async function fetchBlobBytes(blobUrl, token) {
  const res = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('blob_get_failed:' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, contentType: res.headers.get('content-type') || 'application/octet-stream' };
}

async function listBlobs(prefix, token) {
  const url = new URL('https://blob.vercel-storage.com');
  url.searchParams.set('prefix', prefix);
  url.searchParams.set('limit', '1000');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.blobs) ? data.blobs : [];
}

async function readIndex(token) {
  const blobs = await listBlobs('audits/', token);
  const indexBlob = blobs.find((b) => {
    const p = String(b.pathname || b.url || '');
    return p === INDEX_PATH || p.endsWith('/index.json') || p.endsWith('index.json');
  });
  if (indexBlob && indexBlob.url) {
    try {
      const got = await fetchBlobBytes(indexBlob.url, token);
      const parsed = JSON.parse(got.buf.toString('utf8'));
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.jobs)) return parsed.jobs;
    } catch (e) {
      console.warn('audit index parse', e);
    }
  }
  const jobs = [];
  for (const b of blobs) {
    const p = String(b.pathname || '');
    if (!p.endsWith('.json') || p.endsWith('index.json')) continue;
    try {
      const got = await fetchBlobBytes(b.url, token);
      const job = JSON.parse(got.buf.toString('utf8'));
      if (job && job.id) jobs.push(job);
    } catch (e) { /* skip */ }
  }
  return jobs;
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    email: job.email,
    gender: job.gender,
    surah: job.surah,
    surahName: job.surahName,
    ref: job.ref,
    status: job.status || 'incoming',
    createdAt: job.createdAt,
    mimeType: job.mimeType,
    bytes: job.bytes,
  };
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const origin = req.headers.origin || '';
  if (origin && !originAllowed(origin)) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN missing on server' });
  }

  try {
    if (req.method === 'GET') {
      if (!keyOk(req)) return res.status(401).json({ error: 'bad_key' });
      const q = req.query || {};
      const id = String(q.id || '').trim();
      const jobs = await readIndex(token);

      if (q.file === 'audio' && id) {
        const job = jobs.find((j) => j && j.id === id);
        if (!job || !job.audioUrl) return res.status(404).json({ error: 'not_found' });
        const audio = await fetchBlobBytes(job.audioUrl, token);
        res.setHeader('Content-Type', job.mimeType || audio.contentType);
        res.setHeader('Cache-Control', 'private, max-age=60');
        return res.status(200).send(audio.buf);
      }

      if (id) {
        const job = jobs.find((j) => j && j.id === id);
        if (!job) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json({ ok: true, job: publicJob(job) });
      }

      return res.status(200).json({
        ok: true,
        jobs: jobs.map(publicJob).filter(Boolean).reverse(),
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'POST or GET only' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const audioBase64 = stripDataUrl(body.audioBase64);
    const mimeType = body.mimeType || 'audio/webm';
    const email = String(body.email || '').trim().toLowerCase();
    const gender = body.gender === 'woman' || body.gender === 'man' ? body.gender : '';
    const surah = parseInt(body.surah, 10);
    const surahName = String(body.surahName || '').slice(0, 80);
    const ref = String(body.ref || '').slice(0, 120);

    if (!audioBase64) return res.status(400).json({ error: 'audioBase64 required' });
    if (audioBase64.length > 10_000_000) return res.status(413).json({ error: 'audio too large' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'email required' });
    if (![1, 112, 113, 114].includes(surah)) return res.status(400).json({ error: 'short surah only' });

    const buf = Buffer.from(audioBase64, 'base64');
    if (!buf.length) return res.status(400).json({ error: 'empty audio' });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = stamp + '-' + Math.random().toString(36).slice(2, 8);
    const ext = extFromMime(mimeType);
    const audioPath = 'audits/' + id + '.' + ext;
    const metaPath = 'audits/' + id + '.json';

    const audioBlob = await putToVercelBlob(audioPath, buf, mimeType, token, false);
    const job = {
      id,
      email,
      gender,
      surah,
      surahName,
      ref,
      status: 'incoming',
      paid: false,
      createdAt: new Date().toISOString(),
      mimeType,
      bytes: buf.length,
      audioPathname: audioBlob.pathname || audioPath,
      audioUrl: audioBlob.url || null,
    };
    const metaBuf = Buffer.from(JSON.stringify(job, null, 2), 'utf8');
    await putToVercelBlob(metaPath, metaBuf, 'application/json', token, false);

    const jobs = await readIndex(token);
    jobs.push(job);
    const indexBuf = Buffer.from(JSON.stringify({ jobs }, null, 2), 'utf8');
    await putToVercelBlob(INDEX_PATH, indexBuf, 'application/json', token, true);

    console.log('audit incoming', id, gender, surah, email);
    return res.status(200).json({ ok: true, id, status: 'incoming' });
  } catch (err) {
    console.error('audit', err);
    return res.status(500).json({
      error: 'server_error',
      detail: String(err && err.message ? err.message : err),
    });
  }
};
