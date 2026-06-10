import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

function loadEnv() {
  try {
    const content = readFileSync('.env', 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      } else if (value.includes('#')) {
        console.warn(
          `⚠ ${key} contiene "#" sin comillas. En Nest/dotenv todo después de # se ignora. Usa comillas en .env.`,
        );
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    console.error('No se encontró .env en la raíz del proyecto.');
    process.exit(1);
  }
}

loadEnv();

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASSWORD?.trim();
const secure =
  process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

if (!host || !user || !pass) {
  console.error('Faltan SMTP_HOST, SMTP_USER o SMTP_PASSWORD en .env');
  process.exit(1);
}

if (pass.includes('pon_aqui')) {
  console.error(
    'SMTP_PASSWORD sigue siendo el placeholder. Pon la contraseña real de cPanel.',
  );
  process.exit(1);
}

console.log(`Probando SMTP ${host}:${port} (secure=${secure}) como ${user}...`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: !secure && port === 587,
  auth: { user, pass },
  tls: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
});

try {
  await transporter.verify();
  console.log('OK: autenticación SMTP correcta.');
} catch (error) {
  console.error('FALLO:', error.message);
  process.exit(1);
}
