const {
  setCors,
  randomRoomCode,
  randomPassword,
  createLiveKitToken,
  createRoom,
  shareUrl,
} = require('../lib/livekit-room');

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const displayName = String(body.displayName || 'Hôte').trim().slice(0, 32) || 'Hôte';
    let password = String(body.password || '').trim();
    if (password && password.length < 4) {
      return res.status(400).json({ error: 'password_too_short', detail: 'Min. 4 caractères' });
    }
    if (!password) password = randomPassword();

    const roomCode = randomRoomCode();
    await createRoom(roomCode, password);
    const { token, url } = await createLiveKitToken(roomCode, displayName, true);

    return res.status(200).json({
      roomCode,
      password,
      shareUrl: shareUrl(req, roomCode),
      token,
      livekitUrl: url,
    });
  } catch (err) {
    console.error('room/create', err);
    const msg = String(err && err.message ? err.message : err);
    if (msg.includes('LIVEKIT')) {
      return res.status(500).json({ error: 'livekit_not_configured' });
    }
    return res.status(500).json({ error: 'server_error', detail: msg });
  }
};
