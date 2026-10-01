import { createHmac, timingSafeEqual } from 'node:crypto';
import { GUEST_NAME, ACCESS_CODE, SESSION_SECRET } from '../lib/config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  if (name.length > 60 || code.length > 100 || !name || !code) return res.status(400).json({ error: 'Completa tu nombre y el código.' });
  const expectedName = GUEST_NAME.normalize('NFKC').toLocaleLowerCase('es');
  const suppliedName = name.normalize('NFKC').toLocaleLowerCase('es');
  const hashed = (value) => createHmac('sha256', SESSION_SECRET).update(value).digest();
  if (!timingSafeEqual(hashed(expectedName), hashed(suppliedName)) || !timingSafeEqual(hashed(ACCESS_CODE), hashed(code))) return res.status(401).json({ error: 'Nombre o código incorrecto.' });
  const expires = Date.now() + 2 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ name: GUEST_NAME, expires })).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  res.setHeader('Set-Cookie', `invitation=${payload}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=7200`);
  return res.status(200).json({ ok: true });
}
