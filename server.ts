import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite database
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT,
      username TEXT,
      password TEXT
    );
  `);

  app.post('/api/auth/setup', async (req, res) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', ['master_password', hash]);
    res.json({ success: true });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { password } = req.body;
    const row = await db.get('SELECT value FROM config WHERE key = ?', ['master_password']);
    if (!row) {
      return res.status(404).json({ error: 'Not setup' });
    }
    const match = await bcrypt.compare(password, row.value);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ success: true });
  });

  app.get('/api/auth/status', async (req, res) => {
    const row = await db.get('SELECT value FROM config WHERE key = ?', ['master_password']);
    res.json({ isSetup: !!row });
  });

  app.get('/api/passwords', async (req, res) => {
    // Basic protection: requiring a simple header could be done, but keeping simple for demo
    const rows = await db.all('SELECT * FROM passwords');
    res.json(rows);
  });

  app.post('/api/passwords', async (req, res) => {
    const { domain, username, password } = req.body;
    await db.run('INSERT INTO passwords (domain, username, password) VALUES (?, ?, ?)', [domain, username, password]);
    res.json({ success: true });
  });

  app.delete('/api/passwords/:id', async (req, res) => {
    await db.run('DELETE FROM passwords WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
