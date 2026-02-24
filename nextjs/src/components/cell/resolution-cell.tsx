import { useToast } from "@/hooks/use-toast";
import { CellSourceType, CellState, ProofStatus } from "@/lib/shared/types";
import { cn } from "@/lib/utils";
import { Check, Hourglass, ThumbsUp, X } from "lucide-react";
import { useState, useEffect } from "react";
import { MarkCellCompleteDialog } from "../dialogs/complete-dialog";
import { EditCellDialog } from "../dialogs/edit-cell";
import { RequestProofDialog } from "../dialogs/request-proof";
import { CellThreadDialog } from "../dialogs/thread-dialog";
import { Badge } from "../ui/badge";
import { Cell } from "./cell";
import { BingoCell } from "./types";
import { EmptyCell } from "./empty";

interface ResolutionCellProps {
    cell: BingoCell,
    existingCells: BingoCell[],
    editMode: boolean,
    teamId: string,
    isOwner: boolean,
    currentUserId: string,
    onUpdate?: (cellId: string, cellState: "pending" | "completed") => void,
    onRefresh?: () => void,
}

export const ResolutionCell = ({
    cell,
    existingCells,
    editMode,
    teamId,
    isOwner,
    currentUserId,
    onUpdate,
    onRefresh
}: ResolutionCellProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'complete' | 'request_proof' | 'thread' | 'edit_cell' | null>(null);
    const [usernames, setUsernames] = useState<Record<string, string>>({});
    const { toast } = useToast();

    const handleClick = () => {
        if (!canInteract) return;
        if (canEditContent) {
            setModalMode('edit_cell');
            setIsModalOpen(true);
            return;
        }  
        if (isOwner) {
            if (cell.state === CellState.PENDING) {
                setModalMode('complete');
                setIsModalOpen(true);
                return;
            }
            if (cell.state === CellState.PENDING_REVIEW) {
                setModalMode('thread');
                setIsModalOpen(true);
                return;
            }
            // isOwner && completed --> set pending
            if (cell.state === CellState.COMPLETED){
                onUpdate?.(cell.id, CellState.PENDING);
                return;
            }
        }
        // Viewing someone else's card
        if (cell.state === CellState.COMPLETED) {
            setModalMode('request_proof');
            setIsModalOpen(true);
            return;
        }
        if (cell.state === CellState.PENDING_REVIEW) {
            setModalMode('thread');
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        // Fetch username for the cell's source user (client-safe via API)
        const fetchUsernames = async () => {
            const teamMemberUsernamesRes = await fetch(`/api/teams/${teamId}/members`);
            const teamMemberUsernamesData: { members?: Record<string, string>; error?: string } =
                await teamMemberUsernamesRes.json().catch(() => ({}));
            if (!teamMemberUsernamesRes.ok) {
                toast({
                    title: 'Error',
                    description: teamMemberUsernamesData?.error || 'Failed to load team member usernames',
                    variant: 'destructive',
                });
                return;
            }
            setUsernames(teamMemberUsernamesData.members ?? {});
        };
        fetchUsernames();
        if (!isModalOpen) {
            setModalMode(null);
        }
    }, [isModalOpen, teamId, toast]);

    const stateConfig = {
        pending: { icon: null, color: "bg-card hover:bg-secondary/50", text: "text-card-foreground" },
        completed: { icon: <Check className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300" },
        pending_review: { icon: <Hourglass className="h-4 w-4 text-amber-500" />, color: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-300" },
        accomplished: { icon: <ThumbsUp className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300 line-through" },
        declined: { icon: <X className="h-4 w-4 text-red-500" />, color: "bg-red-100 dark:bg-red-900/50", text: "text-red-800 dark:text-red-300" },
    };
    // Determine visual state based on cell state and proof status
    let visualState: keyof typeof stateConfig = cell.state;
    if (cell.proof) {
        if (cell.proof.status === ProofStatus.PENDING) visualState = 'pending_review';
        else if (cell.proof.status === ProofStatus.DECLINED) visualState = 'declined';
        else if (cell.proof.status === ProofStatus.APPROVED) visualState = 'accomplished';
    }

    const config = stateConfig[visualState] || stateConfig.pending;
    // Spec: 09-bingo-card-editing.md - In edit mode, any non-joker, non-team cell is selectable (including empty)
    const canEditContent = Boolean(editMode && isOwner && cell.sourceType !== CellSourceType.TEAM);
    const canInteract =
        cell.state !== CellState.ACCOMPLISHED &&    // Accomplished cells have no interactions
        (
            canEditContent ||
            (!editMode && !cell.isEmpty && (isOwner || cell.state === CellState.COMPLETED || cell.state === CellState.PENDING_REVIEW))
        );
    return (
        <>
            {cell.isEmpty ?
                <EmptyCell 
                    editMode={editMode}
                    isOwner={isOwner} 
                    onClick={handleClick}/>
            :
                <Cell
                    cellClassName={cn(
                        "relative flex flex-col items-center justify-center aspect-square p-2 rounded-lg border shadow-sm text-center transition-all duration-300",
                        config.color,
                        canInteract ? "cursor-pointer hover:scale-105 hover:shadow-md" : "cursor-default"
                    )}
                    isDisabled={!canInteract}
                    onClick={handleClick}>

                    <p className={cn("text-xs md:text-sm font-medium", config.text)}>
                        {cell.resolutionText}
                    </p>
                    <div className="absolute top-1 right-1">
                        {visualState !== 'pending' && config.icon}
                    </div>
                    <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
                        {cell.sourceType === CellSourceType.TEAM && "Team Goal"}
                        {cell.sourceType === CellSourceType.MEMBER_PROVIDED && (cell.sourceUserId ? (usernames[cell.sourceUserId] ?? "Team member") : "Team member")}
                        {cell.sourceType === CellSourceType.PERSONAL && "Personal"}
                    </Badge>
                </Cell>
            }
            {modalMode === "complete" &&
                <MarkCellCompleteDialog
                    cell={{
                        id: cell.id,
                        resolutionText: cell.resolutionText
                    }}
                    open={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onUpdate={onUpdate} />
            }
            {modalMode === "request_proof" &&
                <RequestProofDialog
                    cell={{
                        id: cell.id,
                        resolutionText: cell.resolutionText
                    }}
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onRefresh={onRefresh} />
            }
            {modalMode === "edit_cell" && isOwner &&
                <EditCellDialog
                    cellId={cell.id}
                    existingCells={existingCells}
                    teamId={teamId ? teamId : ""}
                    currentUserId={currentUserId ? currentUserId : ""}
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onRefresh={onRefresh} />
            }
            {modalMode === "thread" &&
                <CellThreadDialog
                    cell={{
                        id: cell.id,
                        resolutionText: cell.resolutionText,
                        reviewThreadId: cell.reviewThreadId ? cell.reviewThreadId : ""
                    }}
                    isOwner={isOwner}
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    onRefresh={onRefresh} />
            }
        </>
    );
}