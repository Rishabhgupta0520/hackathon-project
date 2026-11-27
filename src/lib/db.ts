/**
 * GhostWire Secure Audit Ledger, Encrypted Share Vault & User Auth Database
 * Uses better-sqlite3 with zero-knowledge constraints:
 * STRICT RULE: No raw unmasked PII is EVER inserted or stored here.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DB_DIR = isServerless ? path.join('/tmp', '.data') : path.join(process.cwd(), '.data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'ghostwire.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    timestamp TEXT NOT NULL,
    document_type TEXT NOT NULL,
    entities_count INTEGER NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    categories_json TEXT NOT NULL,
    strategy_used TEXT NOT NULL,
    epsilon REAL,
    anonymized_summary TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS share_vault (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ciphertext_base64 TEXT NOT NULL,
    iv_base64 TEXT NOT NULL,
    salt_base64 TEXT NOT NULL,
    iterations INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    document_type TEXT NOT NULL,
    title TEXT
  );
`);

// Safe column migrations if database already existed
try {
  db.exec(`ALTER TABLE audit_logs ADD COLUMN user_id TEXT;`);
} catch {
  // column already exists
}
try {
  db.exec(`ALTER TABLE share_vault ADD COLUMN user_id TEXT;`);
} catch {
  // column already exists
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  password_salt?: string;
  role: string;
  created_at: string;
}

/**
 * Seed Instant Demo Security Analyst if not present
 */
function seedDemoUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('analyst@ghostwire.io');
  if (!existing) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync('GhostWire2026!', salt, 64).toString('hex');
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, password_salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr_demo_analyst_001',
      'analyst@ghostwire.io',
      'Security Analyst',
      hash,
      salt,
      'analyst',
      new Date().toISOString()
    );
  }
}
seedDemoUser();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function createUser(name: string, email: string, password: string, role = 'analyst'): UserRecord {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    throw new Error('User already exists with this email');
  }

  const { hash, salt } = hashPassword(password);
  const id = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, password_salt, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, normalizedEmail, name.trim(), hash, salt, role, now);

  return {
    id,
    email: normalizedEmail,
    name: name.trim(),
    role,
    created_at: now,
  };
}

export function getUserByEmail(email: string): UserRecord | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRecord | undefined;
  return row || null;
}

export function getUserById(id: string): UserRecord | null {
  const row = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id) as UserRecord | undefined;
  return row || null;
}

export function getUserStats(userId: string) {
  const auditRow = db.prepare(`
    SELECT COUNT(*) as totalScans, COALESCE(SUM(entities_count), 0) as entitiesProtected
    FROM audit_logs
    WHERE user_id = ? OR user_id IS NULL
  `).get(userId) as { totalScans: number; entitiesProtected: number } | undefined;

  const vaultRow = db.prepare(`
    SELECT COUNT(*) as savedVaults
    FROM share_vault
    WHERE user_id = ? OR user_id IS NULL
  `).get(userId) as { savedVaults: number } | undefined;

  return {
    totalScans: auditRow?.totalScans || 0,
    entitiesProtected: auditRow?.entitiesProtected || 0,
    savedVaults: vaultRow?.savedVaults || 0,
  };
}

export interface AuditEntryInput {
  id: string;
  userId?: string;
  documentType: string;
  entitiesCount: number;
  riskScore: number;
  riskLevel: string;
  categories: Record<string, number>;
  strategyUsed: string;
  epsilon?: number;
  anonymizedSummary: string;
}

export function insertAuditLog(entry: AuditEntryInput) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      id, user_id, timestamp, document_type, entities_count, risk_score,
      risk_level, categories_json, strategy_used, epsilon, anonymized_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    entry.id,
    entry.userId || null,
    new Date().toISOString(),
    entry.documentType,
    entry.entitiesCount,
    entry.riskScore,
    entry.riskLevel,
    JSON.stringify(entry.categories),
    entry.strategyUsed,
    entry.epsilon || null,
    entry.anonymizedSummary
  );
}

export function getAuditLogs(limit = 50, userId?: string) {
  if (userId) {
    const stmt = db.prepare(`
      SELECT * FROM audit_logs
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY timestamp DESC LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  const stmt = db.prepare(`
    SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?
  `);
  return stmt.all(limit);
}

export interface VaultStoreInput {
  id: string;
  userId?: string;
  ciphertextBase64: string;
  ivBase64: string;
  saltBase64: string;
  iterations: number;
  expiresInHours?: number;
  documentType: string;
  title?: string;
}

export function insertVaultItem(item: VaultStoreInput) {
  const now = new Date();
  const expires = new Date(now.getTime() + (item.expiresInHours || 24) * 60 * 60 * 1000);

  const stmt = db.prepare(`
    INSERT INTO share_vault (
      id, user_id, ciphertext_base64, iv_base64, salt_base64, iterations, created_at, expires_at, document_type, title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    item.id,
    item.userId || null,
    item.ciphertextBase64,
    item.ivBase64,
    item.saltBase64,
    item.iterations,
    now.toISOString(),
    expires.toISOString(),
    item.documentType,
    item.title || 'Encrypted Redacted Document'
  );
}

export function getVaultItem(id: string) {
  const stmt = db.prepare(`
    SELECT * FROM share_vault WHERE id = ?
  `);
  const item: any = stmt.get(id);
  if (!item) return null;

  // Check expiration
  if (new Date(item.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM share_vault WHERE id = ?').run(id);
    return null;
  }

  return item;
}

export { db };
