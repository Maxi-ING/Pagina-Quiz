import { createHash } from 'node:crypto';

// Cambia estos dos valores para personalizar el acceso.
export const GUEST_NAME = process.env.GUEST_NAME || 'chica';
export const ACCESS_CODE = process.env.ACCESS_CODE || '123';

// Para una invitación privada publicada, configura SESSION_SECRET en Vercel.
export const SESSION_SECRET = process.env.SESSION_SECRET || createHash('sha256').update(`demo-invitacion:${ACCESS_CODE}`).digest('hex');
