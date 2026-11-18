
import pg from 'pg';

const { Pool } = pg;

const required = [
  'DATABASE_HOST',
  'DATABASE_NAME',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

const pool = new Pool({
  host: process.env.DATABASE_HOST ,
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME ,
  user: process.env.DATABASE_USERNAME ,
  password: process.env.DATABASE_PASSWORD  ,
  max: 3,
  connectionTimeoutMillis: 10000
});

export default pool;

