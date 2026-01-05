/**
 * Bingo Card Repository - Database operations for bingo cards
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { query, getConnection } from './connection';
import type {
  BingoCard,
  BingoCell,
  BingoCellWithProof,
  BingoCardWithCells,
  CellProof,
  CellState,
  CellSourceType,
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { getTeamById, getTeamMembers, isTeamMember } from './team-repository';
import { getTeamProvidedResolutionsForUser } from './team-repository';
import { getRandomResolutions } from './resolution-repository';

// Row types from database
interface CardRow {
  id: string;
  team_id: string;
  user_id: string;
  grid_size: number;
  created_at: Date;
}

interface CellRow {
  id: string;
  card_id: string;
  position: number;
  resolution_text: string;
  is_joker: boolean | number;
  is_empty: boolean | number;
  source_type: CellSourceType;
  source_user_id: string | null;
  state: CellState;
  created_at: Date;
  updated_at: Date;
}

interface ProofRow {
  id: string;
  cell_id: string;
  file_url: string | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'declined';
  created_at: Date;
  updated_at: Date;
}

// Convert functions
function rowToCard(row: CardRow): BingoCard {
  return {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    gridSize: row.grid_size,
    createdAt: row.created_at,
  };
}

function rowToCell(row: CellRow): BingoCell {
  return {
    id: row.id,
    cardId: row.card_id,
    position: row.position,
    resolutionText: row.resolution_text,
    isJoker: Boolean(row.is_joker),
    isEmpty: Boolean(row.is_empty),
    sourceType: row.source_type,
    sourceUserId: row.source_user_id,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProof(row: ProofRow): CellProof {
  return {
    id: row.id,
    cellId: row.cell_id,
    fileUrl: row.file_url,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generate bingo cards for all team members
 * Spec: 05-bingo-card-generation.md - Generation Rules
 */
export async function generateBingoCardsForTeam(teamId: string): Promise<BingoCard[]> {
  const team = await getTeamById(teamId);
  if (!team || team.status !== 'started') {
    throw new Error('Team must be in started status to generate cards');
  }

  if (!team.teamResolutionText) {
    throw new Error('Team resolution must be set');
  }

  const members = await getTeamMembers(teamId);
  const cards: BingoCard[] = [];

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    for (const member of members) {
      const card = await generateCardForUser(
        connection,
        teamId,
        member.userId,
        team.teamResolutionText
      );
      cards.push(card);
    }

    await connection.commit();
    return cards;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Generate a single card for a user
 * Internal helper
 */
async function generateCardForUser(
  connection: Awaited<ReturnType<typeof getConnection>>,
  teamId: string,
  userId: string,
  teamResolutionText: string
): Promise<BingoCard> {
  const gridSize = 5;
  const totalCells = gridSize * gridSize;
  const centerPosition = 12; // Center of 5x5 grid (0-indexed)

  // Create the card
  const cardId = uuidv4();
  await connection.execute(
    `INSERT INTO bingo_cards (id, team_id, user_id, grid_size) VALUES (?, ?, ?, ?)`,
    [cardId, teamId, userId, gridSize]
  );

  // Get member-provided resolutions for this user
  // Spec: 05-bingo-card-generation.md - Step 3
  const providedResolutions = await getTeamProvidedResolutionsForUser(teamId, userId);
  
  // Collect resolution texts with source info
  const cellData: {
    text: string;
    sourceType: CellSourceType;
    sourceUserId: string | null;
    isJoker: boolean;
    isEmpty: boolean;
  }[] = [];

  const usedTexts = new Set<string>();

  // Add team resolution as a completable cell (highest priority)
  cellData.push({
    text: teamResolutionText,
    sourceType: 'team',
    sourceUserId: null,
    isJoker: false,
    isEmpty: false,
  });
  usedTexts.add(teamResolutionText.toLowerCase());

  // Add member-provided resolutions
  // Spec: 05-bingo-card-generation.md - Step 3
  for (const res of providedResolutions) {
    if (cellData.length >= totalCells - 1) break; // Leave room for joker
    if (!usedTexts.has(res.text.toLowerCase())) {
      cellData.push({
        text: res.text,
        sourceType: 'member_provided',
        sourceUserId: res.fromUserId,
        isJoker: false,
        isEmpty: false,
      });
      usedTexts.add(res.text.toLowerCase());
    }
  }

  // Fill remaining with personal resolutions
  // Spec: 05-bingo-card-generation.md - Step 4
  const neededPersonal = totalCells - 1 - cellData.length;
  if (neededPersonal > 0) {
    const personalResolutions = await getRandomResolutions(
      userId,
      neededPersonal * 2, // Get extra in case of duplicates
      Array.from(usedTexts)
    );

    for (const res of personalResolutions) {
      if (cellData.length >= totalCells - 1) break;
      if (!usedTexts.has(res.text.toLowerCase())) {
        cellData.push({
          text: res.text,
          sourceType: 'personal',
          sourceUserId: userId,
          isJoker: false,
          isEmpty: false,
        });
        usedTexts.add(res.text.toLowerCase());
      }
    }
  }

  // Fill any remaining with empty cells
  // Spec: 05-bingo-card-generation.md - Step 5
  while (cellData.length < totalCells - 1) {
    cellData.push({
      text: 'Empty',
      sourceType: 'empty',
      sourceUserId: null,
      isJoker: false,
      isEmpty: true,
    });
  }

  // Shuffle the cells (excluding joker position)
  // Spec: 05-bingo-card-generation.md - randomize selection
  shuffleArray(cellData);

  // Insert cells into database
  for (let position = 0; position < totalCells; position++) {
    const cellId = uuidv4();

    if (position === centerPosition) {
      // Insert joker at center - informational only, displays "Joker"
      // Spec: 06-bingo-gameplay.md - Joker cell is informational and not checkable
      await connection.execute(
        `INSERT INTO bingo_cells 
         (id, card_id, position, resolution_text, is_joker, is_empty, source_type, source_user_id, state)
         VALUES (?, ?, ?, ?, TRUE, FALSE, 'team', NULL, 'to_complete')`,
        [cellId, cardId, position, 'Joker']
      );
    } else {
      // Get the cell data for this position (accounting for joker)
      const dataIndex = position < centerPosition ? position : position - 1;
      const data = cellData[dataIndex];

      await connection.execute(
        `INSERT INTO bingo_cells 
         (id, card_id, position, resolution_text, is_joker, is_empty, source_type, source_user_id, state)
         VALUES (?, ?, ?, ?, FALSE, ?, ?, ?, 'to_complete')`,
        [cellId, cardId, position, data.text, data.isEmpty, data.sourceType, data.sourceUserId]
      );
    }
  }

  return {
    id: cardId,
    teamId,
    userId,
    gridSize,
    createdAt: new Date(),
  };
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Get bingo card for a user in a team
 */
export async function getBingoCard(
  teamId: string,
  userId: string
): Promise<BingoCardWithCells | null> {
  const cardRows = await query<CardRow[]>(
    `SELECT * FROM bingo_cards WHERE team_id = ? AND user_id = ?`,
    [teamId, userId]
  );

  if (cardRows.length === 0) return null;

  const card = rowToCard(cardRows[0]);
  const cells = await getCellsWithProofs(card.id);

  return {
    ...card,
    cells,
  };
}

/**
 * Get bingo card by ID
 */
export async function getBingoCardById(cardId: string): Promise<BingoCardWithCells | null> {
  const cardRows = await query<CardRow[]>(
    `SELECT * FROM bingo_cards WHERE id = ?`,
    [cardId]
  );

  if (cardRows.length === 0) return null;

  const card = rowToCard(cardRows[0]);
  const cells = await getCellsWithProofs(card.id);

  return {
    ...card,
    cells,
  };
}

/**
 * Get cells with proofs for a card
 */
async function getCellsWithProofs(cardId: string): Promise<BingoCellWithProof[]> {
  const cellRows = await query<CellRow[]>(
    `SELECT * FROM bingo_cells WHERE card_id = ? ORDER BY position ASC`,
    [cardId]
  );

  const cells: BingoCellWithProof[] = [];

  for (const row of cellRows) {
    const cell = rowToCell(row);

    // Get latest proof if any
    const proofRows = await query<ProofRow[]>(
      `SELECT * FROM cell_proofs WHERE cell_id = ? ORDER BY created_at DESC LIMIT 1`,
      [cell.id]
    );

    cells.push({
      ...cell,
      proof: proofRows.length > 0 ? rowToProof(proofRows[0]) : null,
    });
  }

  return cells;
}

/**
 * Update cell state
 * Spec: 06-bingo-gameplay.md - Card State
 */
export async function updateCellState(
  cellId: string,
  userId: string,
  newState: CellState
): Promise<{ success: boolean; error?: string; cell?: BingoCell }> {
  // Get the cell and verify ownership
  const cellRows = await query<CellRow[]>(
    `SELECT c.*, bc.user_id as card_user_id
     FROM bingo_cells c
     JOIN bingo_cards bc ON c.card_id = bc.id
     WHERE c.id = ?`,
    [cellId]
  );

  if (cellRows.length === 0) {
    return { success: false, error: 'Cell not found' };
  }

  const cell = cellRows[0];

  // Spec: 06-bingo-gameplay.md - Only the card owner can change their card's cell states
  if ((cell as CellRow & { card_user_id: string }).card_user_id !== userId) {
    return { success: false, error: 'Only the card owner can update cell state' };
  }

  // Spec: 06-bingo-gameplay.md - "empty" filler cells cannot be marked completed
  if (cell.is_empty && newState === 'completed') {
    return { success: false, error: 'Empty cells cannot be marked as completed' };
  }

  // Spec: 06-bingo-gameplay.md - Joker cell is informational and not checkable
  if (cell.is_joker) {
    return { success: false, error: 'Joker cell cannot be modified' };
  }

  // Update the state
  await query(
    `UPDATE bingo_cells SET state = ? WHERE id = ?`,
    [newState, cellId]
  );

  const updatedRows = await query<CellRow[]>(
    `SELECT * FROM bingo_cells WHERE id = ?`,
    [cellId]
  );

  return { success: true, cell: rowToCell(updatedRows[0]) };
}

/**
 * Get all bingo cards for a team (for visibility)
 * Spec: 08-visibility-and-updates.md
 */
export async function getTeamBingoCards(
  teamId: string,
  requestingUserId: string
): Promise<BingoCardWithCells[]> {
  // Verify requesting user is a team member
  // Spec: 08-visibility-and-updates.md - Only team members can view team cards
  const isMember = await isTeamMember(teamId, requestingUserId);
  if (!isMember) {
    return [];
  }

  const cardRows = await query<CardRow[]>(
    `SELECT * FROM bingo_cards WHERE team_id = ?`,
    [teamId]
  );

  const cards: BingoCardWithCells[] = [];

  for (const row of cardRows) {
    const card = rowToCard(row);
    const cells = await getCellsWithProofs(card.id);
    cards.push({ ...card, cells });
  }

  return cards;
}

/**
 * Get a specific cell
 */
export async function getCellById(cellId: string): Promise<BingoCellWithProof | null> {
  const cellRows = await query<CellRow[]>(
    `SELECT * FROM bingo_cells WHERE id = ?`,
    [cellId]
  );

  if (cellRows.length === 0) return null;

  const cell = rowToCell(cellRows[0]);

  const proofRows = await query<ProofRow[]>(
    `SELECT * FROM cell_proofs WHERE cell_id = ? ORDER BY created_at DESC LIMIT 1`,
    [cell.id]
  );

  return {
    ...cell,
    proof: proofRows.length > 0 ? rowToProof(proofRows[0]) : null,
  };
}

/**
 * Report duplicate in card
 * Spec: 05-bingo-card-generation.md - Duplicate Handling
 */
export async function reportDuplicate(
  cellId: string,
  reporterUserId: string,
  replacementText?: string
): Promise<{ success: boolean; error?: string }> {
  // Get cell and card info
  const cellRows = await query<(CellRow & { card_user_id: string; team_id: string })[]>(
    `SELECT c.*, bc.user_id as card_user_id, bc.team_id
     FROM bingo_cells c
     JOIN bingo_cards bc ON c.card_id = bc.id
     WHERE c.id = ?`,
    [cellId]
  );

  if (cellRows.length === 0) {
    return { success: false, error: 'Cell not found' };
  }

  const cell = cellRows[0];

  // Verify reporter is either the card owner or the source user
  // Spec: 05-bingo-card-generation.md - The card owner OR the member who provided the duplicated resolution can report
  if (cell.card_user_id !== reporterUserId && cell.source_user_id !== reporterUserId) {
    return { success: false, error: 'Only the card owner or resolution provider can report duplicates' };
  }

  // Create duplicate report
  const reportId = uuidv4();
  await query(
    `INSERT INTO duplicate_reports (id, cell_id, reporter_user_id, replacement_text, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [reportId, cellId, reporterUserId, replacementText || null]
  );

  // If replacement text provided, update the cell
  if (replacementText && replacementText.trim()) {
    await query(
      `UPDATE bingo_cells SET resolution_text = ? WHERE id = ?`,
      [replacementText.trim(), cellId]
    );

    await query(
      `UPDATE duplicate_reports SET status = 'resolved', resolved_at = NOW() WHERE id = ?`,
      [reportId]
    );
  }

  return { success: true };
}
