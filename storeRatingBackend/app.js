import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { DATABASE_URL, PGSSLMODE } = process.env;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

const app = express();
app.use(express.json());


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = process.env.PORT || 3000;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function authOptional(req, _res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [payload.sub]);
      if (rows[0]) req.user = rows[0];
    } catch {
     
    }
  }
  next();
}


function requireAuth(req, res, next) {
  return authMiddleware(req, res, next);
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
 
  pool.query('SELECT role FROM users WHERE id = $1::int', [req.user.id])
    .then(({ rows }) => {
      const role = rows[0]?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      next();
    })
    .catch(() => res.status(500).json({ error: 'Auth check failed' }));
}

function requireOwner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  pool.query('SELECT role FROM users WHERE id = $1::int', [req.user.id])
    .then(({ rows }) => {
      const role = rows[0]?.role;
      if (role !== 'owner') return res.status(403).json({ error: 'Owner only' });
      next();
    })
    .catch(() => res.status(500).json({ error: 'Auth check failed' }));
}


function buildFilterClause({ q, role }) {

  const conditions = [];
  const params = [];
  let i = 1;

  if (q) {
    conditions.push(`(LOWER(name) LIKE $${i} OR LOWER(email) LIKE $${i} OR LOWER(address) LIKE $${i})`);
    params.push(`%${q.toLowerCase()}%`);
    i++;
  }
  if (role) {
    conditions.push(`role = $${i}`);
    params.push(role);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}


const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5)
});
const changePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6),
}).refine(d => d.current_password !== d.new_password, {
  path: ['new_password'],
  message: 'New password must be different from current password',
});


app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'error', error: e.message });
  }
});


app.post('/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, password } = parsed.data;

  const { rows: existing } = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing[0]) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const role = 'user';
  const address = null;

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, LOWER($2), $3, $4, $5)
     RETURNING id, name, email, role`,
    [name, email, passwordHash, address, role]
  );
  const user = rows[0];
  const token = signToken(user);
  res.status(201).json({ user, token });
});

app.post('/auth/signin', async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const { rows } = await pool.query(
    'SELECT id, name, email, role, password FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, address FROM users WHERE id = $1::int',
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

app.post('/auth/change-password', authMiddleware, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { current_password, new_password } = parsed.data;

  const { rows } = await pool.query('SELECT id, name, email, role, password FROM users WHERE id = $1::int', [req.user.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = bcrypt.compareSync(current_password, user.password);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(new_password, 10);
  await pool.query('UPDATE users SET password = $1 WHERE id = $2::int', [newHash, user.id]);

  const token = signToken(user); 
  res.json({ message: 'Password updated', token });
});


app.get('/stores', authOptional, async (req, res) => {
  const userId = req.user?.id ?? null; 

  const { rows } = await pool.query(`
    SELECT
      s.id, s.name, s.address, s.created_at,
      COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
      COUNT(r.id) AS ratings_count,
      MAX(r2.rating) AS user_rating
    FROM stores s
    LEFT JOIN ratings r  ON r.store_id  = s.id
    LEFT JOIN ratings r2 ON r2.store_id = s.id AND r2.user_id = $1::int
    GROUP BY s.id
    ORDER BY s.name ASC;
  `, [userId]);

  res.json({ stores: rows });
});




app.get('/stores/:id', authOptional, async (req, res) => {
  const storeId = req.params.id;       
  const userId  = req.user?.id ?? null;

  const { rows: storeRows } = await pool.query(`
    SELECT
      s.id, s.name, s.address, s.created_at,
      COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
      COUNT(r.id) AS ratings_count,
      MAX(r2.rating) AS user_rating
    FROM stores s
    LEFT JOIN ratings r  ON r.store_id  = s.id
    LEFT JOIN ratings r2 ON r2.store_id = s.id AND r2.user_id = $2::int
    WHERE s.id = $1::int
    GROUP BY s.id
  `, [storeId, userId]);

  const store = storeRows[0];
  if (!store) return res.status(404).json({ error: 'Store not found' });

  const { rows: ratingRows } = await pool.query(`
    SELECT id, user_id, rating, created_at
    FROM ratings
    WHERE store_id = $1::int
    ORDER BY created_at DESC
    LIMIT 10
  `, [storeId]);

  res.json({ store: { ...store, recent_ratings: ratingRows } });
});


app.post('/stores/:id/ratings', authMiddleware, async (req, res) => {
  const { id } = req.params; 
  const parsed = ratingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { rating } = parsed.data;

  
  const { rows: storeRows } = await pool.query('SELECT id FROM stores WHERE id = $1', [id]);
  if (!storeRows[0]) return res.status(404).json({ error: 'Store not found' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO ratings (store_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET rating = EXCLUDED.rating, created_at = NOW()
       RETURNING id, store_id, user_id, rating, created_at`,
      [id, req.user.id, rating]
    );
    res.status(201).json({ rating: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Could not save rating' });
  }
});

app.post('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, address = null, role = 'user' } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password are required' });
  }
  if (!['admin', 'user', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const exists = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (exists.rows[0]) return res.status(409).json({ error: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, LOWER($2), $3, $4, $5)
     RETURNING id, name, email, address, role, created_at`,
    [name, email, hash, address, role]
  );
  res.status(201).json({ user: rows[0] });
});

app.post('/admin/stores', requireAuth, requireAdmin, async (req, res) => {
  const { name, email = null, address = null, owner_id = null, owner_email = null } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  let ownerId = owner_id ? Number(owner_id) : null;

  if (!ownerId && owner_email) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND role = $2',
      [owner_email, 'owner']
    );
    if (!rows[0]) return res.status(400).json({ error: 'owner_email must belong to a user with role=owner' });
    ownerId = rows[0].id;
  }

  if (ownerId) {
    const own = await pool.query('SELECT 1 FROM users WHERE id = $1::int AND role = $2', [ownerId, 'owner']);
    if (!own.rows[0]) return res.status(400).json({ error: 'Invalid owner' });
  }

  const { rows: created } = await pool.query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES ($1, LOWER($2), $3, $4)
     RETURNING id, name, email, address, owner_id, created_at`,
    [name, email, address, ownerId]
  );

  res.status(201).json({ store: created[0] });
});


app.get('/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
  const [{ rows: u }, { rows: s }, { rows: r }] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total_users FROM users'),
    pool.query('SELECT COUNT(*)::int AS total_stores FROM stores'),
    pool.query('SELECT COUNT(*)::int AS total_ratings FROM ratings'),
  ]);
  res.json({
    total_users: u[0].total_users,
    total_stores: s[0].total_stores,
    total_ratings: r[0].total_ratings,
  });
});

app.get('/admin/stores', requireAuth, requireAdmin, async (req, res) => {
  const q = (req.query.q || '').toString().trim(); 
  const { where, params } = (() => {
    const conditions = [];
    const args = [];
    let i = 1;
    if (q) {
      conditions.push(`(LOWER(s.name) LIKE $${i} OR LOWER(COALESCE(s.email,'')) LIKE $${i} OR LOWER(COALESCE(s.address,'')) LIKE $${i})`);
      args.push(`%${q.toLowerCase()}%`); i++;
    }
    return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params: args };
  })();

  const sql = `
    SELECT
      s.id, s.name, s.email, s.address, s.owner_id, s.created_at,
      COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS rating,
      COUNT(r.id) AS ratings_count
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    ${where}
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT 200;
  `;
  const { rows } = await pool.query(sql, params);
  res.json({ stores: rows });
});

app.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const role = (req.query.role || '').toString().trim(); 

  const { where, params } = buildFilterClause({ q, role });
  const sql = `
    SELECT id, name, email, address, role, created_at
    FROM users
    ${where}
    ORDER BY created_at DESC
    LIMIT 200;
  `;
  const { rows } = await pool.query(sql, params);
  res.json({ users: rows });
});

app.get('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const userId = Number(req.params.id) || 0;
  const { rows: urows } = await pool.query(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = $1::int',
    [userId]
  );
  const user = urows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  let owner_stats = null;
  if (user.role === 'owner') {
    const { rows: sstats } = await pool.query(`
      SELECT
        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS owner_avg_rating,
        COUNT(r.id) AS owner_ratings_count
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = $1::int
    `, [userId]);

    const { rows: stores } = await pool.query(`
      SELECT
        s.id, s.name, s.email, s.address,
        COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS store_avg_rating,
        COUNT(r.id) AS store_ratings_count
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE s.owner_id = $1::int
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [userId]);

    owner_stats = {
      owner_avg_rating: sstats[0].owner_avg_rating,
      owner_ratings_count: sstats[0].owner_ratings_count,
      stores,
    };
  }

  res.json({ user, owner_stats });
});

app.get('/owner/stores', requireAuth, requireOwner, async (req, res) => {
  const ownerId = req.user.id;
  const { rows } = await pool.query(`
    SELECT
      s.id, s.name, s.email, s.address, s.created_at,
      COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS average_rating,
      COUNT(r.id) AS ratings_count
    FROM stores s
    LEFT JOIN ratings r ON r.store_id = s.id
    WHERE s.owner_id = $1::int
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [ownerId]);
  res.json({ stores: rows });
});

app.post('/owner/stores', requireAuth, requireOwner, async (req, res) => {
  const ownerId = req.user.id;
  const { name, email = null, address = null } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const { rows } = await pool.query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES ($1, LOWER($2), $3, $4)
     RETURNING id, name, email, address, owner_id, created_at`,
    [name, email, address, ownerId]
  );
  res.status(201).json({ store: rows[0] });
});

app.get('/owner/stores/:id/ratings', requireAuth, requireOwner, async (req, res) => {
  const ownerId = req.user.id;
  const storeId = Number(req.params.id) || 0;

  const { rows: own } = await pool.query(
    'SELECT id FROM stores WHERE id = $1::int AND owner_id = $2::int',
    [storeId, ownerId]
  );
  if (!own[0]) return res.status(403).json({ error: 'Not your store' });

  const { rows: ratings } = await pool.query(
    `SELECT id, user_id, rating, created_at
     FROM ratings
     WHERE store_id = $1::int
     ORDER BY created_at DESC
     LIMIT 100`,
    [storeId]
  );
  res.json({ ratings });
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Store Ratings API running on http://localhost:${PORT}`));
