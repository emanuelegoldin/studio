"use client";

/**
 * Bingo Card Component
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CellSourceType, CellState, ProofStatus } from "@/lib/shared/types";
import { JokerCell } from "./cell/joker";
import { ResolutionCell } from "./cell/resolution-cell";

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: CellSourceType;
  sourceUserId: string | null;
  state: CellState;
  reviewThreadId?: string | null;
  proof: {
    id: string;
    status: ProofStatus;
  } | null;
}

interface BingoCardProps {
  cells: BingoCell[];
  isOwner?: boolean;
  teamId?: string;
  currentUserId?: string;
  onCellUpdate?: (cellId: string, newState: 'pending' | 'completed') => void;
  onRefresh?: () => void;
}

export function BingoCard({ cells, isOwner = false, teamId, currentUserId, onCellUpdate, onRefresh }: BingoCardProps) {
  // Sort cells by position
  const sortedCells = [...cells].sort((a, b) => a.position - b.position);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    // Safety: cannot stay in edit mode when not the owner
    if (!isOwner) setEditMode(false);
  }, [isOwner]);

  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {editMode ? 'Edit mode: select a cell to replace it.' : ''}
          </p>
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? 'Done' : 'Edit Card'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-5 grid-rows-5 gap-2 md:gap-4">
        {sortedCells.map((cell) => (
          cell.isJoker ?
          <JokerCell key={cell.id} />
          :
          <ResolutionCell
              key={cell.id}
              cell={cell}
              isOwner={isOwner}
              editMode={editMode}
              teamId={teamId ? teamId : ""}
              currentUserId={currentUserId ? currentUserId : ""}
              existingCells={sortedCells}
              onUpdate={onCellUpdate}
              onRefresh={onRefresh}/>
        ))}
      </div>
    </div>
  );
}
