const { valid } = require('./tokens.js');

function adminGuard(req, res, next) {
  const auth = req.headers['authorization'] ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!valid(token)) {
    return res.status(401).json({ error: 'Admin login required' });
  }
  next();
}

module.exports = { adminGuard };
