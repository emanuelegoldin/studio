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
import { findUserById } from "@/lib/db";

interface BingoCell {
  id: string;
  cardId: string;
  position: number;
  resolutionText: string;
  isJoker: boolean;
  isEmpty: boolean;
  sourceType: string;
  sourceUserId: string | null;
  state: 'pending' | 'completed' | 'pending_review' | 'accomplished';
  reviewThreadId?: string | null;
  proof: {
    id: string;
    status: 'pending' | 'approved' | 'declined';
  } | null;
}

interface BingoSquareProps {
  cell: BingoCell;
  isOwner: boolean;
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

function BingoSquare({ cell, isOwner, onUpdate, onRefresh }: BingoSquareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'complete' | 'request_proof' | 'thread' | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [thread, setThread] = useState<any | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  const canInteract =
    isCheckable &&
    (isOwner || cell.state === 'completed' || cell.state === 'pending_review');

  const handleClick = () => {
    if (!canInteract) return;

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
    if (!isModalOpen) {
      setSelectedFile(null);
      setMessageDraft('');
      setThread(null);
      setIsThreadLoading(false);
      setModalMode(null);
      setIsSubmitting(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const loadThread = async () => {
      if (!isModalOpen || modalMode !== 'thread') return;
      const threadId = (cell.reviewThreadId || thread?.id) as string | undefined;
      if (!threadId) return;

      setIsThreadLoading(true);
      try {
        const res = await fetch(`/api/threads/${threadId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            title: 'Error',
            description: data?.error || 'Failed to load review thread',
            variant: 'destructive',
          });
          return;
        }
        setThread(data.thread);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load review thread',
          variant: 'destructive',
        });
      } finally {
        setIsThreadLoading(false);
      }
    };

    loadThread();
  }, [cell.reviewThreadId, isModalOpen, modalMode, thread?.id, toast]);

  const handleUploadClick = () => {
    if (isSubmitting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleMarkComplete = async () => {
    if (!onUpdate) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Spec 06: PENDING -> COMPLETED, no proof triggered automatically.
      onUpdate(cell.id, 'completed');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestProof = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cells/${cell.id}/request-proof`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to request proof',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Proof requested',
        description: 'A review thread has been opened for this resolution.',
      });

      // Switch to thread view immediately when possible.
      const threadId = data?.thread?.id as string | undefined;
      if (threadId) {
        setThread(data.thread);
        setModalMode('thread');
      }

      // Parent pages keep cards in local state; request-proof changes cell state server-side.
      // Best-effort refresh so the card reflects the new state/thread.
      onRefresh?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to request proof',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshThread = async () => {
    const threadId = cell.reviewThreadId || thread?.id;
    if (!threadId) return;
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setThread(data.thread);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async () => {
    const threadId = cell.reviewThreadId || thread?.id;
    if (!threadId) return;
    if (isSubmitting) return;

    const content = messageDraft.trim();
    if (!content) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to post message',
          variant: 'destructive',
        });
        return;
      }
      setMessageDraft('');
      await refreshThread();
      onRefresh?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (vote: 'accept' | 'deny') => {
    const threadId = cell.reviewThreadId || thread?.id;
    if (!threadId) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to submit vote',
          variant: 'destructive',
        });
        return;
      }
      await refreshThread();
      onRefresh?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFileToThread = async () => {
    const threadId = cell.reviewThreadId || thread?.id;
    if (!threadId) return;
    if (!selectedFile) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.set('file', selectedFile);

      const res = await fetch(`/api/threads/${threadId}/files`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to upload file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(null);
      await refreshThread();
      onRefresh?.();
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
          {visualState !== 'pending' && !cell.isJoker && config.icon}
        </div>
        {!cell.isJoker && !cell.isEmpty && cell.sourceType === 'team' && (
          <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
            Team Goal
          </Badge>
        )}
        {!cell.isJoker && !cell.isEmpty && cell.sourceType === 'member_provided' && (
          <Badge variant="outline" className="absolute bottom-1 right-1 text-xs">
            {cell.sourceUserId ? findUserById(cell.sourceUserId).then(u => u?.username) : "Team member"}
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
            {modalMode === 'complete' && (
              <>
                <DialogTitle className="font-headline">Mark as Completed?</DialogTitle>
                <DialogDescription>
                  You are about to mark "{cell.resolutionText}" as completed.
                </DialogDescription>
              </>
            )}

            {modalMode === 'request_proof' && (
              <>
                <DialogTitle className="font-headline">Request Proof?</DialogTitle>
                <DialogDescription>
                  Request proof for "{cell.resolutionText}". This will open a review thread and move the resolution into review.
                </DialogDescription>
              </>
            )}

            {modalMode === 'thread' && (
              <>
                <DialogTitle className="font-headline">Review Thread</DialogTitle>
                <DialogDescription>
                  Discussion, files, and voting for "{cell.resolutionText}".
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          {modalMode === 'thread' && (
            <div className="space-y-4 py-4">
              {isThreadLoading ? (
                <p className="text-sm text-muted-foreground">Loading thread…</p>
              ) : thread ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant="outline">{thread.status}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Files</p>
                    {thread.files?.length ? (
                      <div className="space-y-1">
                        {thread.files.map((f: any) => (
                          <a
                            key={f.id}
                            href={f.filePath}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm underline"
                          >
                            {f.fileName}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No files yet</p>
                    )}

                    {isOwner && thread.status === 'open' && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf,video/*"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />

                        <div className="flex items-center justify-between gap-3">
                          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isSubmitting}>
                            Choose File
                          </Button>
                          {selectedFile ? (
                            <p className="text-xs text-muted-foreground truncate">{selectedFile.name}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No file selected</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUploadFileToThread}
                          disabled={isSubmitting || !selectedFile}
                        >
                          Upload
                        </Button>
                      </>
                    )}
                  </div>

                  {!isOwner && thread.status === 'open' && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Vote</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleVote('accept')} disabled={isSubmitting}>
                          Accept
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleVote('deny')} disabled={isSubmitting}>
                          Deny
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Messages</p>
                    {thread.messages?.length ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-2">
                        {thread.messages.map((m: any) => (
                          <div key={m.id} className="text-sm">
                            <p className="text-xs text-muted-foreground">{findUserById(m.id).then(u => u?.username)}</p>
                            <p>{m.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    )}

                    <Textarea
                      placeholder="Write a message…"
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      disabled={isSubmitting || thread.status !== 'open'}
                      rows={3}
                    />
                    <Button onClick={handleSendMessage} disabled={isSubmitting || thread.status !== 'open'}>
                      Send
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Thread not available.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            {modalMode === 'complete' && (
              <Button onClick={handleMarkComplete} disabled={isSubmitting}>
                <ThumbsUp className="mr-2 h-4 w-4" />Mark Complete
              </Button>
            )}
            {modalMode === 'request_proof' && (
              <Button onClick={handleRequestProof} disabled={isSubmitting}>
                Request Proof
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface BingoCardProps {
  cells: BingoCell[];
  isOwner?: boolean;
  onCellUpdate?: (cellId: string, newState: 'pending' | 'completed') => void;
  onRefresh?: () => void;
}

export function BingoCard({ cells, isOwner = false, onCellUpdate, onRefresh }: BingoCardProps) {
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
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
