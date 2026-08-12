const crypto = require('crypto');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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

function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    throw new Error('LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET required');
  }
  const httpUrl = url.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  return { url, httpUrl, apiKey, apiSecret };
}

function randomRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

function randomPassword() {
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return pwd;
}

function roomName(roomCode) {
  return `tilmidh-${String(roomCode).toUpperCase()}`;
}

function hashPassword(roomCode, password) {
  const pepper = process.env.ROOM_PEPPER || 'tilmidh-room-v1';
  return crypto
    .createHash('sha256')
    .update(`${pepper}:${String(roomCode).toUpperCase()}:${password}`)
    .digest('hex');
}

function sanitizeIdentity(name) {
  const base =
    String(name || 'Participant')
      .trim()
      .slice(0, 24)
      .replace(/[^\w\s-]/g, '') || 'Participant';
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

async function createLiveKitToken(roomCode, displayName, isHost = false) {
  const { url, apiKey, apiSecret } = getLiveKitConfig();
  const identity = sanitizeIdentity(displayName);
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: String(displayName || 'Participant').slice(0, 32),
    ttl: '6h',
  });
  at.addGrant({
    roomJoin: true,
    room: roomName(roomCode),
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
  });
  const token = await at.toJwt();
  return { token, url, identity };
}

async function createRoom(roomCode, password) {
  const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
  const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  const name = roomName(roomCode);
  const pwdHash = hashPassword(roomCode, password);
  try {
    await svc.createRoom({
      name,
      emptyTimeout: 600,
      maxParticipants: 50,
      metadata: JSON.stringify({ pwdHash, created: Date.now() }),
    });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (!msg.toLowerCase().includes('already exists')) throw e;
  }
  return name;
}

async function verifyRoomPassword(roomCode, password) {
  const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
  const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  const name = roomName(roomCode);
  const rooms = await svc.listRooms([name]);
  const room = rooms.find((r) => r.name === name);
  if (!room) return { ok: false, error: 'room_not_found' };
  let meta = {};
  try {
    meta = JSON.parse(room.metadata || '{}');
  } catch {
    meta = {};
  }
  const expected = meta.pwdHash;
  const provided = hashPassword(roomCode, password);
  if (!expected || expected !== provided) {
    return { ok: false, error: 'wrong_password' };
  }
  return { ok: true };
}

function shareUrl(req, roomCode) {
  const origin = req.headers.origin;
  const base = origin || process.env.SITE_URL || 'https://tilmidh.app';
  return `${base.replace(/\/$/, '')}/?room=${encodeURIComponent(roomCode)}`;
}

module.exports = {
  setCors,
  randomRoomCode,
  randomPassword,
  createLiveKitToken,
  createRoom,
  verifyRoomPassword,
  shareUrl,
};
