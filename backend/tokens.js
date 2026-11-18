import crypto from 'node:crypto';

const tokens = new Set();

export function create() {
  const token = crypto.randomBytes(32).toString('base64url');
  tokens.add(token);
  return token;
}

export function valid(token) {
  return token != null && tokens.has(token);
}

export function revoke(token) {
  if (token != null) tokens.delete(token);
}
