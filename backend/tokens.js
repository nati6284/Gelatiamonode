const crypto = require('crypto');

const tokens = new Set();

function create() {
  const token = crypto.randomBytes(32).toString('base64url');
  tokens.add(token);
  return token;
}

function valid(token) {
  return token != null && tokens.has(token);
}

function revoke(token) {
  if (token != null) tokens.delete(token);
}

module.exports = { create, valid, revoke };
