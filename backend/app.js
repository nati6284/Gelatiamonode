require('dotenv').config();
const express = require('express');
const { migrate } = require('./migrate.js');
const publicRouter = require('./public.js');
const adminRouter = require('./admin.js');

const PORT        = process.env.SERVER_PORT;
const CORS_ORIGIN = process.env.CORS_ALLOWED_ORIGIN;

const app = express();

// CORS
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin',  CORS_ORIGIN);
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.use(express.json({ limit: '10mb' }));

app.use('/api',       publicRouter);
app.use('/api/admin', adminRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`Cafe API listening on port ${PORT}`));
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
