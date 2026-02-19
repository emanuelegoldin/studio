"use client";

import { ReviewFile, ReviewMessageAndAuthor, ReviewThreadWithDetails } from "@/lib/db/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { CellDialog } from "./cell-dialog"
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function getWsUrl(): string | null {
  // Prefer the build-time env var if set (local dev outside Docker)
  const env = process.env.NEXT_PUBLIC_WS_URL;
  if (env && (env.startsWith('ws://') || env.startsWith('wss://'))) {
    return env.replace(/\/$/, '');
  }
  // In production / Docker, derive from current page origin via nginx /ws proxy
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws`;
  }
  return null;
}

interface CellThreadDialogProps {
    cell: {
        id: string, 
        resolutionText: string,
        reviewThreadId: string
    }
    isOwner: boolean,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    onRefresh?: () => void
}

export const CellThreadDialog = ({
    cell,
    isOwner,
    isOpen,
    setIsOpen,
    onRefresh
}: CellThreadDialogProps) => {
  // TODO: Check whether not cleaning up state is an issue (we do not call setIsOpen(false) here)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageDraft, setMessageDraft] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [thread, setThread] = useState<ReviewThreadWithDetails | null>(null);
    const [isThreadLoading, setIsThreadLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { toast } = useToast();
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // const refreshThread = async (threadIdOverride?: string) => {
    //     const threadId = threadIdOverride ?? cell.reviewThreadId ?? thread?.id;
    //     if (!threadId) return;
    //     try {
    //       const res = await fetch(`/api/threads/${threadId}`);
    //       const data = await res.json().catch(() => ({}));
    //     if (res.ok) setThread(data.thread);
    //     } catch {
    //     // ignore
    //     }
    // };

    useEffect(() => {
      if (!isOpen) return;
      let cancelled = false;

      const loadCurrentUsername = async () => {
        try {
          const res = await fetch('/api/profile');
          const data = await res.json().catch(() => ({}));
          const username = data?.user?.username;
          if (!cancelled && res.ok && typeof username === 'string' && username) {
            setCurrentUsername(username);
          }
        } catch {
          // ignore
        }
      };

      loadCurrentUsername();
      return () => {
        cancelled = true;
      };
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const threadId = cell.reviewThreadId || thread?.id;
      if (!threadId) return;

      const wsUrl = getWsUrl();
      if (!wsUrl) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const joinMessage: JoinThreadWSMessage = {
          type: 'join-thread',
          body: { threadId },
        };
        ws.send(JSON.stringify(joinMessage));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!data || typeof data !== 'object') return;
        const { username, content } = data as Partial<ThreadMessageBroadcast>;
        if (typeof username !== 'string' || typeof content !== 'string') return;

        // TODO: what should we do if the database update fails?
        if (thread && thread.id === threadId) {
          setThread({
            ...thread,
            messages: [...(thread.messages || []), { id: `temp-${Date.now()}`, authorUsername: username, content }],
          });
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error occurred:', e);
      };

      return () => {
        if (wsRef.current === ws) wsRef.current = null;
        try {
          ws.close();
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      };
    }, [cell.reviewThreadId, isOpen, thread?.id]);

    useEffect(() => {
        const loadThread = async () => {
        if (!isOpen) return;
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
    }, [cell.reviewThreadId, isOpen, thread?.id, toast]);

    const handleUploadClick = () => {
        if (isSubmitting) return;
        fileInputRef.current?.click();
    };

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const file = e.target.files?.[0] || null;
      setSelectedFile(file);
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
        onRefresh?.();
        } finally {
        setIsSubmitting(false);
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

        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          const wsMessage: ThreadMessageWSMessage = {
            type: 'thread-message',
            body: {
              threadId,
              username: currentUsername ?? 'User',
              content,
            },
          };
          ws.send(JSON.stringify(wsMessage));
        }
        // Optimistic update of sent message - TODO: should we prefer pessimistic update?
        if (thread) {
          setThread({
            ...thread,
            messages: [...(thread.messages || []), { id: `temp-${Date.now()}`, authorUsername: currentUsername ?? 'User', content }],
          });
        }
        setMessageDraft('');
        onRefresh?.();
        } finally {
        setIsSubmitting(false);
        }
    };

    return (
        <CellDialog
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title="Review Thread"
          description={`Discussion, files, and voting for "${cell.resolutionText}".`}
        >
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
                        {thread.messages.map((m: ReviewMessageAndAuthor) => {
                          return (
                            <div key={m.id} className="text-sm">
                              <p className="text-xs text-muted-foreground">{m.authorUsername ?? 'User'}</p>
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
        </CellDialog>
    );
}