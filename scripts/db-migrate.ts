/**
 * Database migration runner with history.
 *
 * Why this exists:
 * - `scripts/setup-db.ts` can create tables, but doesn't provide a durable migration history.
 * - This script tracks applied migrations in `schema_migrations`.
 *
 * Usage:
 *   npm run db:migrate
 *   npm run db:baseline
 *   npm run db:status
 *
 * Notes:
 * - Migrations are read from ./migrations/*.sql (lexicographically sorted).
 * - Migrations should be idempotent or only applied once.
 */

import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

type Mode = 'migrate' | 'baseline' | 'status';

function getMode(argv: string[]): Mode {
  const mode = (argv[2] ?? 'migrate').toLowerCase();
  if (mode === 'migrate' || mode === 'baseline' || mode === 'status') return mode;
  throw new Error(`Unknown mode: ${argv[2]}. Use: migrate|baseline|status`);
}

function normalizeForChecksum(sql: string): string {
  return sql.replace(/\r\n/g, '\n');
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

async function listMigrationFiles(migrationsDir: string): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function ensureDatabaseAndHistoryTable(params: {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
}): Promise<void> {
  const connection = await mysql.createConnection({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    multipleStatements: true,
  });

  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${params.dbName}\``);
  await connection.changeUser({ database: params.dbName });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(255) PRIMARY KEY,
      checksum_sha256 CHAR(64) NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.end();
}

async function getAppliedMigrations(params: {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
}): Promise<Map<string, { checksum_sha256: string; applied_at: string }>> {
  const connection = await mysql.createConnection({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.dbName,
  });

  type MigrationRow = RowDataPacket & { id: string; checksum_sha256: string; applied_at: string };

  const [rows] = await connection.query<MigrationRow[]>(
    'SELECT id, checksum_sha256, applied_at FROM schema_migrations'
  );

  await connection.end();

  return new Map(rows.map((r) => [r.id, { checksum_sha256: r.checksum_sha256, applied_at: r.applied_at }]));
}

async function applyMigration(params: {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
  id: string;
  sql: string;
  checksum: string;
}): Promise<void> {
  const connection = await mysql.createConnection({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.dbName,
    multipleStatements: true,
  });

  try {
    // Note: Some DDL statements auto-commit in MariaDB.
    // We still only record the migration after the SQL executes successfully.
    await connection.query(params.sql);
    await connection.execute(
      'INSERT INTO schema_migrations (id, checksum_sha256) VALUES (?, ?)',
      [params.id, params.checksum]
    );
  } finally {
    await connection.end();
  }
}

async function baselineMigration(params: {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
  id: string;
  checksum: string;
}): Promise<void> {
  const connection = await mysql.createConnection({
    host: params.host,
    port: params.port,
    user: params.user,
    password: params.password,
    database: params.dbName,
  });

  try {
    await connection.execute(
      'INSERT INTO schema_migrations (id, checksum_sha256) VALUES (?, ?)',
      [params.id, params.checksum]
    );
  } finally {
    await connection.end();
  }
}

async function main() {
  const mode = getMode(process.argv);

  const dbName = process.env.DB_NAME || 'resolution_bingo';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';

  const migrationsDir =
    process.env.DB_MIGRATIONS_DIR || path.join(process.cwd(), 'migrations');

  await ensureDatabaseAndHistoryTable({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    dbName,
  });

  const migrationFiles = await listMigrationFiles(migrationsDir);
  const applied = await getAppliedMigrations({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    dbName,
  });

  if (mode === 'status') {
    const pending = migrationFiles.filter((f) => !applied.has(f));

    console.log(`Database: ${dbName}`);
    console.log(`Migrations dir: ${migrationsDir}`);
    console.log(`Applied: ${applied.size}`);
    console.log(`Pending: ${pending.length}`);

    if (pending.length > 0) {
      console.log('\nPending migrations:');
      for (const f of pending) console.log(`- ${f}`);
    }

    return;
  }

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = await readFile(filePath, 'utf8');
    const checksum = sha256Hex(normalizeForChecksum(sql));

    const already = applied.get(file);
    if (already) {
      if (already.checksum_sha256 !== checksum) {
        throw new Error(
          `Migration checksum mismatch for ${file}. ` +
            `DB has ${already.checksum_sha256}, file is ${checksum}. ` +
            `Do not edit already-applied migrations; create a new migration instead.`
        );
      }
      continue;
    }

    if (mode === 'baseline') {
      await baselineMigration({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        dbName,
        id: file,
        checksum,
      });
      console.log(`✓ Baseline recorded: ${file}`);
      continue;
    }

    await applyMigration({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      dbName,
      id: file,
      sql,
      checksum,
    });
    console.log(`✓ Applied: ${file}`);
  }

  if (mode === 'baseline') {
    console.log('\nBaseline complete. Future migrations can now be applied with db:migrate.');
  } else {
    console.log('\nMigrations complete.');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
