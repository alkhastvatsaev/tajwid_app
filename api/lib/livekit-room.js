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

function getRoomPepper() {
  const pepper = process.env.ROOM_PEPPER || process.env.LIVEKIT_API_SECRET;
  if (pepper) return pepper;
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('ROOM_PEPPER required in production');
  }
  return 'tilmidh-room-v1';
}

function hashPassword(roomCode, password) {
  const pepper = getRoomPepper();
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

function signRoomKey(roomCode, password) {
  const secret = process.env.LIVEKIT_API_SECRET || getRoomPepper();
  const pwdHash = hashPassword(roomCode, password);
  return crypto
    .createHmac('sha256', secret)
    .update(`${String(roomCode).toUpperCase()}:${pwdHash}`)
    .digest('base64url');
}

function verifyRoomKey(roomCode, password, roomKey) {
  if (!roomKey || !password) return false;
  try {
    const expected = signRoomKey(roomCode, password);
    const a = Buffer.from(expected);
    const b = Buffer.from(String(roomKey));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function findRoom(roomCode) {
  const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
  const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  const name = roomName(roomCode);
  const rooms = await svc.listRooms([name]);
  return rooms.find((r) => r.name === name) || null;
}

async function createRoom(roomCode, password) {
  const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
  const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  const name = roomName(roomCode);
  const pwdHash = hashPassword(roomCode, password);
  try {
    await svc.createRoom({
      name,
      emptyTimeout: 3600,
      maxParticipants: 50,
      metadata: JSON.stringify({ pwdHash, created: Date.now() }),
    });
  } catch (e) {
    const msg = String(e && e.message ? e.message : e);
    if (!msg.toLowerCase().includes('already exists')) throw e;
    try {
      await svc.updateRoomMetadata(name, JSON.stringify({ pwdHash, created: Date.now() }));
    } catch {
      /* ignore */
    }
  }
  return name;
}

async function ensureRoomExists(roomCode, password) {
  const existing = await findRoom(roomCode);
  if (existing) return existing.name;
  return createRoom(roomCode, password);
}

async function verifyRoomPassword(roomCode, password) {
  const room = await findRoom(roomCode);
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

async function authorizeRoomJoin(roomCode, password, roomKey) {
  if (verifyRoomKey(roomCode, password, roomKey)) {
    await ensureRoomExists(roomCode, password);
    return { ok: true };
  }
  return verifyRoomPassword(roomCode, password);
}

function shareUrl(req, roomCode, password) {
  const origin = req.headers.origin;
  const base = origin || process.env.SITE_URL || 'https://tilmidh.app';
  const k = signRoomKey(roomCode, password);
  return `${base.replace(/\/$/, '')}/?room=${encodeURIComponent(roomCode)}&k=${encodeURIComponent(k)}`;
}

module.exports = {
  setCors,
  randomRoomCode,
  randomPassword,
  createLiveKitToken,
  createRoom,
  verifyRoomPassword,
  authorizeRoomJoin,
  signRoomKey,
  shareUrl,
};
