import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const dest = path.join(publicDir, '_redirects');

const raw = String(process.env.CCIDP_API_ORIGIN || 'https://git.brightgrid.in').trim().replace(/\/$/, '');
const lines = [];

if (/^https:\/\//i.test(raw)) {
  const api = raw.endsWith('/ccidp') ? raw : `${raw}/ccidp`;
  lines.push(
    `/ccidp/*  ${api}/:splat  200!`,
    `/api/*  ${api}/api/:splat  200!`,
    `/actuator/*  ${api}/actuator/:splat  200!`,
    `/.well-known/*  ${api}/.well-known/:splat  200!`,
  );
}

lines.push('/*    /index.html   200');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(dest, `${lines.join('\n')}\n`);
