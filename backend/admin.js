const { Router } = require('express');
const pool = require('./db.js');
const { adminGuard } = require('./adminGuard.js');
const { create: createToken, revoke: revokeToken } = require('./tokens.js');

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gelatiamo@admin#123';

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: createToken() });
});

router.post('/logout', adminGuard, (req, res) => {
  const auth = req.headers['authorization'] ?? '';
  revokeToken(auth.startsWith('Bearer ') ? auth.slice(7) : null);
  res.json({ message: 'Signed out' });
});

// ── Categories ────────────────────────────────────────────────────────────────

router.get('/categories', adminGuard, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories ORDER BY display_order ASC, name ASC',
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/categories', adminGuard, async (req, res, next) => {
  try {
    const { name, displayOrder = 0 } = req.body ?? {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const { rows } = await pool.query(
      'INSERT INTO categories (name, display_order) VALUES ($1,$2) RETURNING *',
      [name.trim(), displayOrder],
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/categories/:id', adminGuard, async (req, res, next) => {
  try {
    const { name, displayOrder = 0 } = req.body ?? {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const { rows } = await pool.query(
      'UPDATE categories SET name=$1, display_order=$2 WHERE id=$3 RETURNING *',
      [name.trim(), displayOrder, req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/categories/:id', adminGuard, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Menu items (catalog) ──────────────────────────────────────────────────────

router.get('/menu', adminGuard, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM menu_items ORDER BY category ASC, name ASC',
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/menu', adminGuard, async (req, res, next) => {
  try {
    const { name, description, category, price, image, available = true, popular = false } = req.body ?? {};
    if (!name || !description || !category || price == null)
      return res.status(400).json({ error: 'name, description, category and price are required' });
    const { rows } = await pool.query(
      `INSERT INTO menu_items (name, description, category, price, image, available, popular)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, description, category, Number(price), image ?? null, Boolean(available), Boolean(popular)],
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/menu/:id', adminGuard, async (req, res, next) => {
  try {
    const { name, description, category, price, image, available, popular } = req.body ?? {};
    const { rows } = await pool.query(
      `UPDATE menu_items
       SET name=$1, description=$2, category=$3, price=$4, image=$5, available=$6, popular=$7
       WHERE id=$8 RETURNING *`,
      [name, description, category, Number(price), image ?? null,
       Boolean(available), Boolean(popular), req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/menu/:id', adminGuard, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM branch_menu_prices WHERE menu_item_id=$1', [req.params.id]);
    const { rowCount } = await pool.query('DELETE FROM menu_items WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Branches ──────────────────────────────────────────────────────────────────

router.get('/branches', adminGuard, async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM branches');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/branches', adminGuard, async (req, res, next) => {
  try {
    const { name, address, phone, code, mapUrl, openingHours, latitude, longitude, active = true, interiorImage } = req.body ?? {};
    if (!name || !address || !code)
      return res.status(400).json({ error: 'name, address and code are required' });
    const { rows } = await pool.query(
      `INSERT INTO branches (name, address, phone, code, map_url, opening_hours, latitude, longitude, active, interior_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, address, phone ?? null, code, mapUrl ?? null,
       openingHours ?? null, latitude ?? null, longitude ?? null, Boolean(active), interiorImage ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/branches/:id', adminGuard, async (req, res, next) => {
  try {
    const { name, address, phone, code, mapUrl, openingHours, latitude, longitude, active, interiorImage } = req.body ?? {};
    const { rows } = await pool.query(
      `UPDATE branches
       SET name=$1, address=$2, phone=$3, code=$4, map_url=$5,
           opening_hours=$6, latitude=$7, longitude=$8, active=$9, interior_image=$10
       WHERE id=$11 RETURNING *`,
      [name, address, phone ?? null, code, mapUrl ?? null,
       openingHours ?? null, latitude ?? null, longitude ?? null,
       Boolean(active), interiorImage ?? null, req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/branches/:id', adminGuard, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM branch_menu_prices WHERE branch_id=$1', [req.params.id]);
    const { rowCount } = await pool.query('DELETE FROM branches WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Branch menu (assign / list / update / remove) ─────────────────────────────

router.get('/branches/:branchId/menu', adminGuard, async (req, res, next) => {
  try {
    const { rows: branchRows } = await pool.query(
      'SELECT id FROM branches WHERE id=$1', [req.params.branchId],
    );
    if (!branchRows.length) return res.status(404).json({ error: 'Branch not found' });

    const { rows } = await pool.query(
      `SELECT
         bmp.id,
         bmp.branch_id    AS "branchId",
         bmp.price,
         bmp.available,
         bmp.branch_image AS "branchImage",
         mi.id            AS "miId",
         mi.name          AS "miName",
         mi.description   AS "miDescription",
         mi.category      AS "miCategory",
         mi.price         AS "miPrice",
         mi.image         AS "miImage",
         mi.available     AS "miAvailable",
         mi.popular       AS "miPopular"
       FROM branch_menu_prices bmp
       JOIN menu_items mi ON mi.id = bmp.menu_item_id
       WHERE bmp.branch_id = $1
       ORDER BY mi.category ASC, mi.name ASC`,
      [req.params.branchId],
    );
    res.json(rows.map(r => ({
      id:          r.id,
      branchId:    r.branchId,
      price:       r.price,
      available:   r.available,
      branchImage: r.branchImage,
      menuItem: {
        id:          r.miId,
        name:        r.miName,
        description: r.miDescription,
        category:    r.miCategory,
        price:       r.miPrice,
        image:       r.miImage,
        available:   r.miAvailable,
        popular:     r.miPopular,
      },
    })));
  } catch (err) { next(err); }
});

router.post('/branches/:branchId/menu/:menuItemId', adminGuard, async (req, res, next) => {
  try {
    const { rows: branchRows } = await pool.query(
      'SELECT * FROM branches WHERE id=$1', [req.params.branchId],
    );
    if (!branchRows.length) return res.status(404).json({ error: 'Branch not found' });

    const { rows: itemRows } = await pool.query(
      'SELECT * FROM menu_items WHERE id=$1', [req.params.menuItemId],
    );
    if (!itemRows.length) return res.status(404).json({ error: 'Menu item not found' });

    const { rows: existing } = await pool.query(
      'SELECT id FROM branch_menu_prices WHERE branch_id=$1 AND menu_item_id=$2',
      [req.params.branchId, req.params.menuItemId],
    );
    if (existing.length) return res.status(409).json({ error: 'Item already in branch menu' });

    const body = req.body ?? {};
    const price       = body.price     != null ? Number(body.price)      : itemRows[0].price;
    const available   = body.available != null ? Boolean(body.available) : true;
    const branchImage = body.branchImage ?? null;

    const { rows } = await pool.query(
      `INSERT INTO branch_menu_prices (branch_id, menu_item_id, price, available, branch_image)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.branchId, req.params.menuItemId, price, available, branchImage],
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/branches/:branchId/menu/:menuItemId', adminGuard, async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT * FROM branch_menu_prices WHERE branch_id=$1 AND menu_item_id=$2',
      [req.params.branchId, req.params.menuItemId],
    );
    if (!existing.length) return res.status(404).json({ error: 'Item not in branch menu' });

    const bmp  = existing[0];
    const body = req.body ?? {};
    const price       = body.price     != null ? Number(body.price)      : bmp.price;
    const available   = body.available != null ? Boolean(body.available) : bmp.available;
    const branchImage = 'branchImage' in body  ? body.branchImage        : bmp.branch_image;

    const { rows } = await pool.query(
      `UPDATE branch_menu_prices SET price=$1, available=$2, branch_image=$3
       WHERE id=$4 RETURNING *`,
      [price, available, branchImage, bmp.id],
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/branches/:branchId/menu/:menuItemId', adminGuard, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM branch_menu_prices WHERE branch_id=$1 AND menu_item_id=$2',
      [req.params.branchId, req.params.menuItemId],
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Feedback ──────────────────────────────────────────────────────────────────

router.get('/feedback', adminGuard, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, b.name AS branch_name
       FROM feedback f
       LEFT JOIN branches b ON b.id = f.branch_id
       ORDER BY f.created_at DESC`,
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.delete('/feedback/:id', adminGuard, async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM feedback WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ── Legacy aliases ────────────────────────────────────────────────────────────

router.get('/branches/:branchId/prices', adminGuard, async (req, res, next) => {
  const { rows: branchRows } = await pool.query(
    'SELECT id FROM branches WHERE id=$1', [req.params.branchId],
  );
  if (!branchRows.length) return res.status(404).json({ error: 'Branch not found' });
  const { rows } = await pool.query(
    `SELECT bmp.*, mi.name AS "menuItemName", mi.category AS "menuItemCategory"
     FROM branch_menu_prices bmp
     JOIN menu_items mi ON mi.id = bmp.menu_item_id
     WHERE bmp.branch_id = $1
     ORDER BY mi.category ASC, mi.name ASC`,
    [req.params.branchId],
  );
  res.json(rows);
});

router.put('/branches/:branchId/prices/:menuItemId', adminGuard, async (req, res, next) => {
  const { rows: existing } = await pool.query(
    'SELECT * FROM branch_menu_prices WHERE branch_id=$1 AND menu_item_id=$2',
    [req.params.branchId, req.params.menuItemId],
  );
  if (!existing.length) return res.status(404).json({ error: 'Item not in branch menu' });
  const bmp  = existing[0];
  const body = req.body ?? {};
  const price       = body.price     != null ? Number(body.price)      : bmp.price;
  const available   = body.available != null ? Boolean(body.available) : bmp.available;
  const branchImage = 'branchImage' in body  ? body.branchImage        : bmp.branch_image;
  const { rows } = await pool.query(
    `UPDATE branch_menu_prices SET price=$1, available=$2, branch_image=$3
     WHERE id=$4 RETURNING *`,
    [price, available, branchImage, bmp.id],
  );
  res.json(rows[0]);
});

module.exports = router;
