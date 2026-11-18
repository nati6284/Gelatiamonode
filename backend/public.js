import { Router } from 'express';
import pool from './db.js';
import fetch from 'node-fetch';

const router = Router();

// Health
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Active branches
router.get('/branches', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM branches WHERE active = TRUE');
    res.json(rows);
  } catch (err) { next(err); }
});

// Categories
router.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories ORDER BY display_order ASC, name ASC',
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// All available menu items
router.get('/menu', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM menu_items WHERE available = TRUE ORDER BY category ASC, name ASC',
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Menu by branch code
router.get('/menu/branch/:branchCode', async (req, res, next) => {
  try {
    const { rows: branches } = await pool.query(
      'SELECT * FROM branches WHERE code = $1', [req.params.branchCode],
    );
    if (!branches.length) return res.status(404).json({ error: 'Branch not found' });

    const { rows } = await pool.query(
      `SELECT
         mi.id, mi.name, mi.description, mi.category,
         bmp.price,
         mi.image         AS "globalImage",
         bmp.branch_image AS "branchImage",
         bmp.available,
         mi.popular
       FROM branch_menu_prices bmp
       JOIN menu_items mi ON mi.id = bmp.menu_item_id
       WHERE bmp.branch_id = $1 AND bmp.available = TRUE
       ORDER BY mi.category ASC, mi.name ASC`,
      [branches[0].id],
    );
    res.json(rows.map(toMenuItemDTO));
  } catch (err) { next(err); }
});

// Popular items for a branch
router.get('/menu/branch/:branchCode/popular', async (req, res, next) => {
  try {
    const { rows: branches } = await pool.query(
      'SELECT * FROM branches WHERE code = $1', [req.params.branchCode],
    );
    if (!branches.length) return res.status(404).json({ error: 'Branch not found' });

    const { rows } = await pool.query(
      `SELECT
         mi.id, mi.name, mi.description, mi.category,
         bmp.price,
         mi.image         AS "globalImage",
         bmp.branch_image AS "branchImage",
         bmp.available,
         mi.popular
       FROM branch_menu_prices bmp
       JOIN menu_items mi ON mi.id = bmp.menu_item_id
       WHERE bmp.branch_id = $1 AND mi.popular = TRUE AND bmp.available = TRUE`,
      [branches[0].id],
    );
    res.json(rows.map(toMenuItemDTO));
  } catch (err) { next(err); }
});

// Global popular items
router.get('/menu/popular', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM menu_items WHERE popular = TRUE AND available = TRUE',
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Image proxy — avoids browser CORS on external images (e.g. for print view)
router.get('/image-proxy', async (req, res, next) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    upstream.body.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Bad gateway' });
  }
});

// DTO helper: branch image overrides global image
function toMenuItemDTO(row) {
  const image = row.branchImage && row.branchImage.trim()
    ? row.branchImage
    : row.globalImage;
  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    category:    row.category,
    price:       row.price,
    image,
    branchImage: row.branchImage,
    available:   row.available,
    popular:     row.popular,
  };
}

export default router;
