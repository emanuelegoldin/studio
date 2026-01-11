"use client";

/**
 * Bingo Card Component
 * Spec Reference: 05-bingo-card-generation.md, 06-bingo-gameplay.md
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Star, Check, Hourglass, ThumbsUp, X, Loader2 } from "lucide-react";
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
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ReviewFile, ReviewMessage, ReviewThreadWithDetails } from "@/lib/db";

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
  const { toast } = useToast();
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [thread, setThread] = useState<ReviewThreadWithDetails | null>(null);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isEditOptionsLoading, setIsEditOptionsLoading] = useState(false);
  const [editOptions, setEditOptions] = useState<EditOption[]>([]);
  const [editFilter, setEditFilter] = useState('');
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
      setSelectedFile(null);
      setMessageDraft('');
      setThread(null);
      setIsThreadLoading(false);
      setIsEditOptionsLoading(false);
      setEditOptions([]);
      setEditFilter('');
      setModalMode(null);
      setIsSubmitting(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const loadEditOptions = async () => {
      if (!isModalOpen || modalMode !== 'edit_cell') return;
      if (!isOwner) return;

      const occupiedKeys = new Set<string>(
        (Array.isArray(allCells) ? allCells : [])
          .filter((c: BingoCell) => !c.isJoker && !c.isEmpty && c.id !== cell.id)
          .map((c: BingoCell) => {
            if (c.sourceType === 'personal' && c.resolutionId) return `personal:${c.resolutionId}`;
            if (c.sourceType === 'member_provided' && c.teamProvidedResolutionId) return `member_provided:${c.teamProvidedResolutionId}`;
            // "team" and "empty" cells do not have a stable resolution id reference.
            return null;
          })
          .filter((v: string | null): v is string => typeof v === 'string' && v.length > 0)
      );

      setIsEditOptionsLoading(true);
      try {
        const personalReq = fetch('/api/resolutions');
        const teamReq = teamId && currentUserId
          ? fetch(`/api/teams/${teamId}/resolutions?toUserId=${encodeURIComponent(currentUserId)}`)
          : null;

        const [personalRes, teamRes] = await Promise.all([
          personalReq,
          teamReq ?? Promise.resolve(null as unknown as Response | null),
        ]);

        const personalData = await personalRes.json().catch(() => ({}));
        if (!personalRes.ok) {
          toast({
            title: 'Error',
            description: personalData?.error || 'Failed to load personal resolutions',
            variant: 'destructive',
          });
          return;
        }

        const personalOptions: EditOption[] = (personalData?.resolutions || [])
          .map((r: any) => ({
          key: `personal:${r.id}`,
          label: r.text,
          resolutionText: r.text,
          resolutionId: typeof r.id === 'string' ? r.id : null,
          teamProvidedResolutionId: null,
          sourceType: 'personal',
          sourceUserId: currentUserId ?? null,
          isEmpty: false,
        }))
          // Prevent duplicates: do not allow selecting texts already used in other non-empty cells
          // Spec: 05-bingo-card-generation.md - No duplicates in a card
          .filter((opt: EditOption) => !occupiedKeys.has(opt.key));

        let teamOptions: EditOption[] = [];
        if (teamRes) {
          const teamData = await teamRes.json().catch(() => ({}));
          if (!teamRes.ok) {
            toast({
              title: 'Error',
              description: teamData?.error || 'Failed to load team-provided resolutions',
              variant: 'destructive',
            });
            return;
          }

          teamOptions = (teamData?.resolutions || [])
            .map((r: any) => ({
            key: `member_provided:${r.id}`,
            label: r.text,
            resolutionText: r.text,
            resolutionId: null,
            teamProvidedResolutionId: typeof r.id === 'string' ? r.id : null,
            sourceType: 'member_provided',
            sourceUserId: typeof r.fromUserId === 'string' ? r.fromUserId : null,
            isEmpty: false,
          }))
            // Prevent duplicates: do not allow selecting texts already used in other non-empty cells
            .filter((opt: EditOption) => !occupiedKeys.has(opt.key));

          // Best-effort: fetch usernames for providers
          const providerIds = Array.from(
            new Set<string>(
              (teamData?.resolutions || [])
                .map((r: any) => r?.fromUserId)
                .filter((v: any): v is string => typeof v === 'string')
            )
          );

          const missing = providerIds.filter((id) => !usernames[id]);
          await Promise.all(missing.map(async (id) => {
            try {
              const res = await fetch(`/api/users/${id}`);
              if (!res.ok) return;
              const data = await res.json();
              if (data?.username) setUsernames(prev => ({ ...prev, [id]: data.username }));
            } catch {
              // ignore
            }
          }));
        }

        setEditOptions([...teamOptions, ...personalOptions]);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load replacement options',
          variant: 'destructive',
        });
      } finally {
        setIsEditOptionsLoading(false);
      }
    };

    loadEditOptions();
    // usernames is intentionally not a dependency to avoid re-loading options on username updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, modalMode, isOwner, teamId, currentUserId, cell.id, allCells, toast]);

  useEffect(() => {
    // When a thread is loaded, fetch author usernames for its messages
    const fetchThreadAuthors = async () => {
      const msgs: Array<ReviewMessage> = thread?.messages || [];
      const ids: string[] = Array.from(new Set<string>(
        msgs
          .map((m: ReviewMessage) => (m.authorUserId))
          .filter((v: any): v is string => typeof v === 'string')
      ));
      const missing = ids.filter((id) => !usernames[id]);
      if (missing.length === 0) return;

      await Promise.all(missing.map(async (id: string) => {
        try {
          const res = await fetch(`/api/users/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data?.username) setUsernames(prev => ({ ...prev, [id]: data.username }));
        } catch {
          // ignore
        }
      }));
    };

    fetchThreadAuthors();
  }, [thread?.messages]);

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

  const handleSelectReplacement = async (opt: EditOption) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cells/${cell.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionId: opt.resolutionId,
          teamProvidedResolutionId: opt.teamProvidedResolutionId,
          sourceType: opt.sourceType,
          sourceUserId: opt.sourceUserId,
          isEmpty: opt.isEmpty,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: 'Error',
          description: data?.error || 'Failed to update cell',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cell updated',
        description: 'The bingo card has been updated.',
      });

      setIsModalOpen(false);
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
            {cell.sourceUserId ? (usernames[cell.sourceUserId] ?? "Team member") : "Team member"}
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

            {modalMode === 'edit_cell' && (
              <>
                <DialogTitle className="font-headline">Edit Cell</DialogTitle>
                <DialogDescription>
                  Choose a replacement resolution for this cell.
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {modalMode === 'edit_cell' && (
            <div className="space-y-3 py-4">
              <Input
                placeholder="Filter resolutions…"
                value={editFilter}
                onChange={(e) => setEditFilter(e.target.value)}
                disabled={isSubmitting || isEditOptionsLoading}
              />

              {isEditOptionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading options…
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-md border p-2 space-y-2">
                  {editOptions
                    .filter((opt) => {
                      const q = editFilter.trim().toLowerCase();
                      if (!q) return true;
                      return opt.label.toLowerCase().includes(q);
                    })
                    .map((opt) => {
                      const isMemberProvided = opt.sourceType === 'member_provided';
                      const providerName = opt.sourceUserId ? (usernames[opt.sourceUserId] ?? 'Team member') : null;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectReplacement(opt)}
                          disabled={isSubmitting}
                          className={cn(
                            'w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-secondary/50 transition-colors',
                            isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium leading-snug">{opt.label}</p>
                            <Badge variant="outline" className="shrink-0">
                              {isMemberProvided ? (providerName ?? 'Member') : 'Personal'}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}

                  {editOptions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No options available.</p>
                  )}
                </div>
              )}
            </div>
          )}

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
                        {thread.files.map((f: ReviewFile) => (
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
                        {thread.messages.map((m: ReviewMessage) => {
                          const authorId = m.authorUserId;
                          return (
                            <div key={m.id} className="text-sm">
                              <p className="text-xs text-muted-foreground">{usernames[authorId] ?? 'User'}</p>
                              <p>{m.content}</p>
                            </div>
                          );
                        })}
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
