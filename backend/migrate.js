const pool = require('./db.js');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(80)  NOT NULL UNIQUE,
        display_order INTEGER      NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(120) NOT NULL,
        description VARCHAR(500) NOT NULL,
        category    VARCHAR(60)  NOT NULL,
        price       DOUBLE PRECISION NOT NULL CHECK (price >= 0),
        image       TEXT,
        available   BOOLEAN NOT NULL DEFAULT TRUE,
        popular     BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS branches (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(120) NOT NULL,
        address       VARCHAR(500) NOT NULL,
        phone         VARCHAR(20),
        code          VARCHAR(100) NOT NULL UNIQUE,
        map_url       VARCHAR(500),
        interior_image TEXT,
        opening_hours VARCHAR(200),
        latitude      DOUBLE PRECISION,
        longitude     DOUBLE PRECISION,
        active        BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS branch_menu_prices (
        id           SERIAL PRIMARY KEY,
        branch_id    INTEGER NOT NULL REFERENCES branches(id),
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        price        DOUBLE PRECISION NOT NULL CHECK (price >= 0),
        branch_image TEXT,
        available    BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE (branch_id, menu_item_id)
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id          SERIAL PRIMARY KEY,
        branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
        phone       VARCHAR(30),
        visit_date  DATE NOT NULL,
        order_desc  VARCHAR(500),
        ratings     JSONB NOT NULL,
        comment     TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
    `);

    await client.query(`
      ALTER TABLE branches ADD COLUMN IF NOT EXISTS interior_image TEXT;
    `);
  } finally {
    client.release();
  }
}

module.exports = { migrate };
