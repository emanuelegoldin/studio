"use client";

/**
 * TeamWsProvider
 *
 * Manages a **single** WebSocket connection per team, shared by every
 * component that needs real-time card updates (BingoCard, ResolutionCell,
 * dialogs, etc.).
 *
 * Usage:
 *   <TeamWsProvider teamId={teamId} onRefresh={reloadCards}>
 *     <BingoCard ... />
 *     <BingoCard ... />
 *   </TeamWsProvider>
 *
 * Child components call `broadcastCardRefresh()` (via `useTeamWs()`) after
 * persisting a mutation. The provider sends one `card-refresh` WS message
 * which the server will broadcast to every *other* client in the same room.
 * Incoming messages from the server invoke the `onRefresh` callback once,
 * no matter how many cards are rendered.
 */

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

// ── WS URL helper ─────────────────────────────────────────────────

function getWsUrl(): string | null {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
  return null;
}

// ── Context ───────────────────────────────────────────────────────

interface TeamWsContextValue {
  /** Send a card-refresh message so other viewers re-fetch. */
  broadcastCardRefresh: () => void;
}

const TeamWsContext = createContext<TeamWsContextValue>({
  broadcastCardRefresh: () => {},
});

/** Hook for child components to broadcast a card refresh. */
export function useTeamWs(): TeamWsContextValue {
  return useContext(TeamWsContext);
}

// ── Provider ──────────────────────────────────────────────────────

interface TeamWsProviderProps {
  /** The team whose card-room we join. */
  teamId: string;
  /** Called when the server pushes a refresh event (another client changed something). */
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function TeamWsProvider({ teamId, onRefresh, children }: TeamWsProviderProps) {
  const wsRef = useRef<WebSocket | null>(null);

  // Stable ref so we don't re-open the socket when onRefresh identity changes.
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // ── Open a single WS for the lifetime of this provider ────────
  useEffect(() => {
    if (!teamId) return;
    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join-card-room",
          body: { teamId },
        })
      );
    };

    ws.onmessage = () => {
      // Any inbound message in this room means "refresh".
      onRefreshRef.current?.();
    };

    ws.onerror = (e) => {
      console.error("[TeamWsProvider] WebSocket error:", e);
    };

    return () => {
      if (wsRef.current === ws) wsRef.current = null;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  }, [teamId]);

  // ── Broadcast helper (stable identity) ────────────────────────
  const broadcastCardRefresh = useCallback(() => {
    if (!teamId) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "card-refresh",
          body: { teamId },
        })
      );
    }
  }, [teamId]);

  return (
    <TeamWsContext.Provider value={{ broadcastCardRefresh }}>
      {children}
    </TeamWsContext.Provider>
  );
}
