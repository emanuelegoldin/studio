import { CellState, ProofStatus } from "@/lib/shared/types";

export interface BingoCell {
    id: string;
    cardId: string;
    position: number;
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