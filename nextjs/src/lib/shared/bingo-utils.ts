/**
 * Bingo detection utilities
 * Spec Reference: 06-bingo-gameplay.md
 *
 * A "bingo" is scored when a player completes an entire row, column,
 * or diagonal on their 5×5 bingo card.
 *
 * A cell counts as "done" when its state is `completed`, `accomplished`,
 * or `pending_review`, or when it is the center joker cell.
 */

import { CellState } from "@/lib/shared/types";

/** Minimal cell shape needed for bingo detection. */
export interface BingoCellForDetection {
  position: number;
  state: CellState;
  isJoker: boolean;
  isEmpty: boolean;
}

/** States that count as "completed" for bingo-line purposes. */
const DONE_STATES: ReadonlySet<CellState> = new Set([
  CellState.COMPLETED,
  CellState.ACCOMPLISHED,
  CellState.PENDING_REVIEW,
]);

/** Check whether a single cell counts as "done". */
function isCellDone(cell: BingoCellForDetection): boolean {
  if (cell.isJoker) return true;
  if (cell.isEmpty) return false;
  return DONE_STATES.has(cell.state);
}

/**
 * Returns `true` when the given set of cells contains at least one
 * complete bingo line (row, column, or diagonal) on a 5×5 grid.
 */
export function hasBingo(cells: BingoCellForDetection[]): boolean {
  const gridSize = 5;

  // Build a quick lookup: position → done?
  const done = new Map<number, boolean>();
  for (const cell of cells) {
    done.set(cell.position, isCellDone(cell));
  }

  // Helper: check if every position in a list is done
  const allDone = (positions: number[]): boolean =>
    positions.every((p) => done.get(p) === true);

  // Rows
  for (let row = 0; row < gridSize; row++) {
    const positions = Array.from({ length: gridSize }, (_, col) => row * gridSize + col);
    if (allDone(positions)) return true;
  }

  // Columns
  for (let col = 0; col < gridSize; col++) {
    const positions = Array.from({ length: gridSize }, (_, row) => row * gridSize + col);
    if (allDone(positions)) return true;
  }

  // Diagonals
  const diag1 = Array.from({ length: gridSize }, (_, i) => i * gridSize + i);
  const diag2 = Array.from({ length: gridSize }, (_, i) => i * gridSize + (gridSize - 1 - i));
  if (allDone(diag1) || allDone(diag2)) return true;

  return false;
}
