"use client";

/**
 * Bingo Card Component
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Check, Hourglass, ThumbsUp, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MarkCellCompleteDialog } from "./dialogs/complete-dialog";
import { RequestProofDialog } from "./dialogs/request-proof";
import { EditCellDialog } from "./dialogs/edit-cell";
import { CellThreadDialog } from "./dialogs/thread-dialog";
import { CellSourceType, CellState, ProofStatus } from "@/lib/shared/types";

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionId?: string | null;
  teamProvidedResolutionId?: string | null;
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

interface BingoSquareProps {
  cell: BingoCell;
  isOwner: boolean;
  editMode?: boolean;
  teamId?: string;
  currentUserId?: string;
  allCells?: BingoCell[];
  onUpdate?: (cellId: string, newState: 'pending' | 'completed') => void;
  onRefresh?: () => void;
}

const stateConfig = {
  pending: { icon: null, color: "bg-card hover:bg-secondary/50", text: "text-card-foreground" },
  completed: { icon: <Check className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300" },
  pending_review: { icon: <Hourglass className="h-4 w-4 text-amber-500" />, color: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-300" },
  accomplished: { icon: <ThumbsUp className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300 line-through" },
  declined: { icon: <X className="h-4 w-4 text-red-500" />, color: "bg-red-100 dark:bg-red-900/50", text: "text-red-800 dark:text-red-300" },
};

type EditOption = {
  key: string;
  label: string;
  resolutionText: string;
  resolutionId: string | null;
  teamProvidedResolutionId: string | null;
  sourceType: 'team' | 'member_provided' | 'personal' | 'empty';
  sourceUserId: string | null;
  isEmpty: boolean;
};

function BingoSquare({ cell, isOwner, editMode = false, teamId, currentUserId, allCells, onUpdate, onRefresh }: BingoSquareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'complete' | 'request_proof' | 'thread' | 'edit_cell' | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  
  // Determine visual state based on cell state and proof status
  let visualState: keyof typeof stateConfig = cell.state;
  if (cell.proof) {
    if (cell.proof.status === 'pending') visualState = 'pending_review';
    else if (cell.proof.status === 'declined') visualState = 'declined';
  }
  
  const config = stateConfig[visualState] || stateConfig.pending;
  
  // Spec: 06-bingo-gameplay.md
  // - Empty filler cells are not checkable
  // - Joker cell is informational only
  const isCheckable = !cell.isJoker && !cell.isEmpty;
  // Spec: 09-bingo-card-editing.md - In edit mode, any non-joker, non-team cell is selectable (including empty)
  const canEditContent = Boolean(editMode && isOwner && !cell.isJoker && cell.sourceType !== 'team');
  const canInteract =
    canEditContent ||
    (!editMode && isCheckable && (isOwner || cell.state === 'completed' || cell.state === 'pending_review'));

  const handleClick = () => {
    if (!canInteract) return;

    if (canEditContent) {
      setModalMode('edit_cell');
      setIsModalOpen(true);
      return;
    }

    if (isOwner) {
      if (cell.state === 'pending') {
        setModalMode('complete');
        setIsModalOpen(true);
        return;
      }

      if (cell.state === 'pending_review') {
        setModalMode('thread');
        setIsModalOpen(true);
        return;
      }

      // completed/accomplished
      onUpdate?.(cell.id, 'pending');
      return;
    }

    // Viewing someone else's card
    if (cell.state === 'completed') {
      setModalMode('request_proof');
      setIsModalOpen(true);
      return;
    }

    if (cell.state === 'pending_review') {
      setModalMode('thread');
      setIsModalOpen(true);
    }
  };

  useEffect(() => {
    // Fetch username for the cell's source user (client-safe via API)
    const fetchCellUser = async () => {
      const id = cell.sourceUserId;
      if (!id) return;
      if (usernames[id]) return;
      try {
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.username) setUsernames(prev => ({ ...prev, [id]: data.username }));
      } catch {
        // ignore
      }
    };

    fetchCellUser();

    if (!isModalOpen) {
      setModalMode(null);
    }
  }, [isModalOpen]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!canInteract}
        className={cn(
          "relative flex flex-col items-center justify-center aspect-square p-2 rounded-lg border shadow-sm text-center transition-all duration-300",
          config.color,
          cell.isJoker ? "bg-primary text-primary-foreground cursor-default" : "",
          cell.isEmpty ? "bg-muted cursor-not-allowed" : "",
          canInteract ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default"
        )}
      >
        {cell.isJoker && <Star className="h-8 w-8 mb-1" />}
        <p className={cn("text-xs md:text-sm font-medium", config.text, cell.isJoker && "text-primary-foreground")}>
          {cell.resolutionText}
        </p>
        <div className="absolute top-1 right-1">
          {visualState !== 'pending' && !cell.isJoker && config.icon}
        </div>
        {!cell.isJoker && !cell.isEmpty && (
          <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
            {cell.sourceType === CellSourceType.TEAM && "Team Goal"}
            {cell.sourceType === CellSourceType.MEMBER_PROVIDED && (cell.sourceUserId ? (usernames[cell.sourceUserId] ?? "Team member") : "Team member")}
            {cell.sourceType === CellSourceType.PERSONAL && "Personal"}
          </Badge>
        )}
      </button>

      {modalMode === "complete" && 
        <MarkCellCompleteDialog 
          cell={{
            id: cell.id,
            resolutionText: cell.resolutionText
          }}
          open={isModalOpen}
          setIsOpen={setIsModalOpen}
          onUpdate={onUpdate}/>
      }
      {modalMode === "request_proof" &&
        <RequestProofDialog
          cell={{
            id: cell.id,
            resolutionText: cell.resolutionText
          }}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onRefresh={onRefresh}/>
      }
      {modalMode === "edit_cell" && isOwner &&
        <EditCellDialog
          cellId={cell.id}
          existingCells={allCells? allCells : []}
          teamId={teamId? teamId : ""}
          currentUserId={currentUserId? currentUserId : ""}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onRefresh={onRefresh}/>
      }
      {modalMode === "thread" && 
        <CellThreadDialog
          cell={{
            id: cell.id,
            resolutionText: cell.resolutionText,
            reviewThreadId: cell.reviewThreadId? cell.reviewThreadId : ""
          }}
          isOwner={isOwner}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          onRefresh={onRefresh}/>
      }
    </>
  );
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
          <BingoSquare 
            key={cell.id} 
            cell={cell} 
            isOwner={isOwner}
            editMode={editMode}
            teamId={teamId}
            currentUserId={currentUserId}
            allCells={sortedCells}
            onUpdate={onCellUpdate}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}
