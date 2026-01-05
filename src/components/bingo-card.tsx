"use client";

/**
 * Bingo Card Component
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Check, Hourglass, ThumbsUp, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: string;
  sourceUserId: string | null;
  state: 'to_complete' | 'completed';
  proof: {
    id: string;
    status: 'pending' | 'approved' | 'declined';
  } | null;
}

interface BingoSquareProps {
  cell: BingoCell;
  isOwner: boolean;
  onUpdate?: (cellId: string, newState: 'to_complete' | 'completed') => void;
}

const stateConfig = {
  to_complete: { icon: null, color: "bg-card hover:bg-secondary/50", text: "text-card-foreground" },
  pending: { icon: <Hourglass className="h-4 w-4 text-amber-500" />, color: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-300" },
  completed: { icon: <Check className="h-4 w-4 text-green-500" />, color: "bg-green-100 dark:bg-green-900/50", text: "text-green-800 dark:text-green-300 line-through" },
  declined: { icon: <X className="h-4 w-4 text-red-500" />, color: "bg-red-100 dark:bg-red-900/50", text: "text-red-800 dark:text-red-300" },
};

function BingoSquare({ cell, isOwner, onUpdate }: BingoSquareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [proofComment, setProofComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine visual state based on cell state and proof status
  let visualState: keyof typeof stateConfig = cell.state;
  if (cell.proof) {
    if (cell.proof.status === 'pending') visualState = 'pending';
    else if (cell.proof.status === 'declined') visualState = 'declined';
  }
  
  const config = stateConfig[visualState] || stateConfig.to_complete;
  
  // Spec: 06-bingo-gameplay.md - Empty cells cannot be marked as completed
  // Spec: 06-bingo-gameplay.md - Joker cell is informational and not checkable
  const canInteract = isOwner && !cell.isJoker && !cell.isEmpty && cell.state === 'to_complete';

  const handleClick = () => {
    if (!canInteract) return;
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen) {
      setProofComment("");
      setSelectedFile(null);
      setIsSubmitting(false);
    }
  }, [isModalOpen]);

  const handleUploadClick = () => {
    if (isSubmitting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleValidationRequest = async () => {
    if (!onUpdate) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const trimmedComment = proofComment.trim();
      const shouldSubmitProof = Boolean(selectedFile) || trimmedComment.length > 0;

      if (shouldSubmitProof) {
        const url = `/api/cells/${cell.id}/proof`;

        let response: Response;
        if (selectedFile) {
          const form = new FormData();
          form.set('file', selectedFile);
          if (trimmedComment.length > 0) {
            form.set('comment', trimmedComment);
          }
          response = await fetch(url, { method: 'POST', body: form });
        } else {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: trimmedComment }),
          });
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          toast({
            title: 'Error',
            description: data?.error || 'Failed to upload proof',
            variant: 'destructive',
          });
          return;
        }
      }

      onUpdate(cell.id, 'completed');
      setIsModalOpen(false);
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'An error occurred while uploading proof',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {visualState !== 'to_complete' && !cell.isJoker && config.icon}
        </div>
        {!cell.isJoker && !cell.isEmpty && cell.sourceType === 'member_provided' && (
          <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
            From Team
          </Badge>
        )}
        {!cell.isJoker && !cell.isEmpty && cell.sourceType === 'personal' && (
          <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
            Personal
          </Badge>
        )}
      </button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Complete Resolution?</DialogTitle>
            <DialogDescription>
              You are about to mark "{cell.resolutionText}" as completed. You can upload proof for your team to verify.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Add a comment or a link to your proof (e.g., photo, screenshot)..."
              value={proofComment}
              onChange={(e) => setProofComment(e.target.value)}
              disabled={isSubmitting}
            />

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isSubmitting}>
                Upload File
              </Button>
              {selectedFile ? (
                <p className="text-xs text-muted-foreground truncate">{selectedFile.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">No file selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleValidationRequest} disabled={isSubmitting}>
              <ThumbsUp className="mr-2 h-4 w-4" />Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface BingoCardProps {
  cells: BingoCell[];
  isOwner?: boolean;
  onCellUpdate?: (cellId: string, newState: 'to_complete' | 'completed') => void;
}

export function BingoCard({ cells, isOwner = false, onCellUpdate }: BingoCardProps) {
  // Sort cells by position
  const sortedCells = [...cells].sort((a, b) => a.position - b.position);

  return (
    <div className="grid grid-cols-5 grid-rows-5 gap-2 md:gap-4">
      {sortedCells.map((cell) => (
        <BingoSquare 
          key={cell.id} 
          cell={cell} 
          isOwner={isOwner}
          onUpdate={onCellUpdate}
        />
      ))}
    </div>
  );
}
