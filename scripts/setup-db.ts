/**
 * Database Setup Script
 * 
 * Run this script to initialize the database schema.
 * Usage: npx tsx scripts/setup-db.ts
 * 
 * Make sure to set up your .env.local file with database credentials first.
 */

import mysql from 'mysql2/promise';
import { schema } from '../src/lib/db/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'resolution_bingo';
  
  // First connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MariaDB server');

  // Create database if not exists
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  console.log(`Database '${dbName}' created or already exists`);

  // Switch to database
  await connection.changeUser({ database: dbName });
  console.log(`Using database '${dbName}'`);

  // Split schema into individual statements and execute
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await connection.execute(statement);
      // Extract table name for logging
      const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      if (match) {
        console.log(`✓ Created table: ${match[1]}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error executing statement: ${errorMessage}`);
    }
  }

  // Apply minimal, safe migrations for existing databases.
  // This is needed because CREATE TABLE IF NOT EXISTS will not update existing columns.
  const migrationStatements: string[] = [
    // 1) Expand legacy enum (to_complete/completed) to also include new states.
    `ALTER TABLE bingo_cells MODIFY COLUMN state ENUM('to_complete', 'completed', 'pending', 'pending_review', 'accomplished') DEFAULT 'pending'`,
    // 2) Map legacy value to the new default state.
    `UPDATE bingo_cells SET state = 'pending' WHERE state = 'to_complete'`,
    // 3) Finalize enum to only the new, spec-defined states.
    `ALTER TABLE bingo_cells MODIFY COLUMN state ENUM('pending', 'completed', 'pending_review', 'accomplished') DEFAULT 'pending'`,
  ];

  for (const statement of migrationStatements) {
    try {
      await connection.execute(statement);
      console.log(`✓ Migration applied: ${statement.split(' ')[0]} ${statement.split(' ')[1]}`);
    } catch (error: unknown) {
      // Migrations should be best-effort: they may fail if already applied.
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Migration skipped/failed (may be already applied): ${errorMessage}`);
    }
  }

  await connection.end();
  console.log('\nDatabase setup complete!');
}

setupDatabase().catch(console.error);
