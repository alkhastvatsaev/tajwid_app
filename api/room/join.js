const { setCors, createLiveKitToken, verifyRoomPassword } = require('../lib/livekit-room');

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const roomCode = String(body.roomCode || '').trim().toUpperCase();
    const password = String(body.password || '').trim();
    const displayName = String(body.displayName || 'Participant').trim().slice(0, 32) || 'Participant';

    if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
      return res.status(400).json({ error: 'invalid_code' });
    }
    if (!password) {
      return res.status(400).json({ error: 'password_required' });
    }

    const check = await verifyRoomPassword(roomCode, password);
    if (!check.ok) {
      const status = check.error === 'room_not_found' ? 404 : 403;
      return res.status(status).json({ error: check.error });
    }

    const { token, url } = await createLiveKitToken(roomCode, displayName, false);
    return res.status(200).json({ roomCode, token, livekitUrl: url });
  } catch (err) {
    console.error('room/join', err);
    const msg = String(err && err.message ? err.message : err);
    if (msg.includes('LIVEKIT')) {
      return res.status(500).json({ error: 'livekit_not_configured' });
    }
    return res.status(500).json({ error: 'server_error', detail: msg });
  }
};
