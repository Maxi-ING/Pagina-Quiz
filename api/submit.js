import { createHmac, timingSafeEqual } from 'node:crypto';
import { SESSION_SECRET } from '../lib/config.js';

function session(req, secret) {
  const raw = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('invitation='))?.slice('invitation='.length);
  if (!raw) return null;
  const [payload, signature, extra] = raw.split('.');
  if (!payload || !signature || extra || payload.length > 500) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual; try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return data.expires > Date.now() && typeof data.name === 'string' ? data : null; } catch { return null; }
}
const short = (value, max) => typeof value === 'string' && value.length <= max ? value.trim() : null;
function todayInLima() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function validFutureDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < todayInLima()) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const { RESEND_API_KEY, REPORT_TO_EMAIL, REPORT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !REPORT_TO_EMAIL || !REPORT_FROM_EMAIL) return res.status(503).json({ error: 'El envío de correo aún no está configurado.' });
  const guest = session(req, SESSION_SECRET);
  if (!guest) return res.status(401).json({ error: 'Tu sesión venció. Actualiza la página e ingresa nuevamente.' });
  const body = req.body || {}, answers = body.answers || {};
  const food = short(answers.food, 100), place = short(answers.place, 100), time = short(answers.time, 40);
  const date = short(answers.date ?? '', 10), note = short(answers.note ?? '', 500), message = short(body.message ?? '', 1000);
  const decision = short(body.decision, 50);
  const validTimes = ['Por la mañana', 'Por la tarde', 'Por la noche'];
  const games = Array.isArray(body.games) && body.games.length <= 4 ? body.games.map((item) => short(item, 120)) : null;
  if (!food || !place || !validTimes.includes(time) || decision !== 'Acepto la invitación' || date === null || !validFutureDate(date) || note === null || message === null || !games || games.some((game) => game === null)) return res.status(400).json({ error: 'Revisa tus respuestas e inténtalo nuevamente.' });
  const lines = [
    `Respuesta de: ${guest.name}`, `Decisión: ${decision}`, '', `Comida: ${food}`, `Lugar: ${place}`, `Momento: ${time}`, `Fecha tentativa: ${date || 'No indicó'}`, `Preferencias adicionales: ${note || 'No indicó'}`, `Juegos: ${games.join('; ') || 'No jugó'}`, `Mensaje final: ${message || 'No indicó'}`
  ];
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REPORT_FROM_EMAIL, to: [REPORT_TO_EMAIL], subject: `Respuesta a tu invitación: ${decision}`, text: lines.join('\n') })
    });
    if (!response.ok) { console.error('Resend status:', response.status); return res.status(502).json({ error: 'No se pudo enviar el correo. Inténtalo de nuevo.' }); }
    return res.status(200).json({ ok: true });
  } catch (error) { console.error('Error de envío:', error); return res.status(502).json({ error: 'No se pudo enviar el correo. Inténtalo de nuevo.' }); }
}
