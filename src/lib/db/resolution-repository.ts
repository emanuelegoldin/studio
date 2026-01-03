/**
 * Resolution Repository - Database operations for personal resolutions
 * Spec Reference: 03-personal-resolutions.md
 */

import { query } from './connection';
import type { Resolution } from './types';
import { v4 as uuidv4 } from 'uuid';

// Row type from database (snake_case)
interface ResolutionRow {
  id: string;
  owner_user_id: string;
  text: string;
  created_at: Date;
  updated_at: Date;
}

// Convert database row to Resolution type
function rowToResolution(row: ResolutionRow): Resolution {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    text: row.text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new personal resolution
 * Spec: 03-personal-resolutions.md - Create
 */
export async function createResolution(
  ownerUserId: string,
  text: string
): Promise<Resolution> {
  // Spec: 03-personal-resolutions.md - Resolution text must be non-empty
  if (!text || text.trim().length === 0) {
    throw new Error('Resolution text must be non-empty');
  }

  const id = uuidv4();
  const trimmedText = text.trim();

  await query(
    `INSERT INTO resolutions (id, owner_user_id, text) VALUES (?, ?, ?)`,
    [id, ownerUserId, trimmedText]
  );

  const rows = await query<ResolutionRow[]>(
    `SELECT * FROM resolutions WHERE id = ?`,
    [id]
  );

  return rowToResolution(rows[0]);
}

/**
 * Get all resolutions for a user
 * Spec: 03-personal-resolutions.md - Read
 */
export async function getResolutionsByUser(userId: string): Promise<Resolution[]> {
  const rows = await query<ResolutionRow[]>(
    `SELECT * FROM resolutions WHERE owner_user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map(rowToResolution);
}

/**
 * Get a resolution by ID
 */
export async function getResolutionById(id: string): Promise<Resolution | null> {
  const rows = await query<ResolutionRow[]>(
    `SELECT * FROM resolutions WHERE id = ?`,
    [id]
  );

  return rows.length > 0 ? rowToResolution(rows[0]) : null;
}

/**
 * Update a resolution
 * Spec: 03-personal-resolutions.md - Update
 */
export async function updateResolution(
  id: string,
  ownerUserId: string,
  text: string
): Promise<Resolution | null> {
  // Spec: 03-personal-resolutions.md - Resolution text must be non-empty
  if (!text || text.trim().length === 0) {
    throw new Error('Resolution text must be non-empty');
  }

  const trimmedText = text.trim();

  // Only update if the user owns the resolution
  // Spec: 03-personal-resolutions.md - Only the resolution owner can update
  const result = await query<{ affectedRows: number }>(
    `UPDATE resolutions SET text = ? WHERE id = ? AND owner_user_id = ?`,
    [trimmedText, id, ownerUserId]
  );

  // Check if any row was updated
  const rows = await query<ResolutionRow[]>(
    `SELECT * FROM resolutions WHERE id = ?`,
    [id]
  );

  if (rows.length === 0 || rows[0].owner_user_id !== ownerUserId) {
    return null;
  }

  return rowToResolution(rows[0]);
}

/**
 * Delete a resolution
 * Spec: 03-personal-resolutions.md - Delete
 */
export async function deleteResolution(
  id: string,
  ownerUserId: string
): Promise<boolean> {
  // Only delete if the user owns the resolution
  // Spec: 03-personal-resolutions.md - Only the resolution owner can delete
  await query(
    `DELETE FROM resolutions WHERE id = ? AND owner_user_id = ?`,
    [id, ownerUserId]
  );

  // Check if the resolution was deleted
  const rows = await query<ResolutionRow[]>(
    `SELECT * FROM resolutions WHERE id = ?`,
    [id]
  );

  return rows.length === 0;
}

/**
 * Get random resolutions for a user (used for filling bingo cards)
 * Spec: 05-bingo-card-generation.md - fallback from personal resolutions
 */
export async function getRandomResolutions(
  userId: string,
  limit: number,
  excludeTexts: string[] = []
): Promise<Resolution[]> {
  if (limit <= 0) return [];

  let sql = `SELECT * FROM resolutions WHERE owner_user_id = ?`;
  const params: unknown[] = [userId];

  if (excludeTexts.length > 0) {
    sql += ` AND text NOT IN (${excludeTexts.map(() => '?').join(', ')})`;
    params.push(...excludeTexts);
  }

  sql += ` ORDER BY RAND() LIMIT ?`;
  params.push(limit);

  const rows = await query<ResolutionRow[]>(sql, params);
  return rows.map(rowToResolution);
}
