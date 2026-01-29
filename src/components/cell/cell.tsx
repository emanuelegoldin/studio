import { CellState, ProofStatus } from "@/lib/shared/types";
import { useState } from "react"

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionId?: string | null;
  teamProvidedResolutionId?: string | null;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: string;
  sourceUserId: string | null;
  state: CellState;
  reviewThreadId?: string | null;
  proof: {
    id: string;
    status: ProofStatus;
  } | null;
}

interface CellProps{
    isEditable: boolean
    isOwner: boolean
}

export const Cell = ({
    isEditable,
    isOwner
}: CellProps) => {
    const [showDialog, setShowDialog] = useState<boolean>(false);

    return (
        <button>
        </button>
    )
}