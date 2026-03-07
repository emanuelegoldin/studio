/**
 * Cross-Team Refresh Context
 * Spec: 13-cross-team-cell-sync.md — real-time card refresh for sibling teams
 *
 * Provides a callback that lets any component trigger a card-refresh
 * for teams OTHER than the current one. The dashboard supplies the
 * implementation which knows about all active cards and the WS URL.
 */

"use client";

import { createContext, useContext, useCallback, useRef, useEffect } from "react";

// ─── WS URL helper (same logic as TeamWsProvider) ───────────────

function getWsUrl(): string | null {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  }
  return null;
}

// ─── Context ────────────────────────────────────────────────────

interface CrossTeamRefreshContextValue {
  /**
   * Reload card data AND broadcast a WS card-refresh for each of the
   * given team IDs.  The current team is typically already handled by
   * the existing `broadcastCardRefresh()` in `TeamWsProvider`, so
   * callers should pass only the *other* affected team IDs.
   */
  refreshTeams: (teamIds: string[]) => void;
}

const CrossTeamRefreshContext = createContext<CrossTeamRefreshContextValue>({
  refreshTeams: () => {},
});

/** Hook for child components to trigger cross-team card refresh. */
export function useCrossTeamRefresh(): CrossTeamRefreshContextValue {
  return useContext(CrossTeamRefreshContext);
}

// ─── Provider ───────────────────────────────────────────────────

interface CrossTeamRefreshProviderProps {
  /**
   * Called for each affected team ID so the parent can reload the
   * card data from the API.
   */
  onRefreshTeam: (teamId: string) => void;
  children: React.ReactNode;
}

/**
 * Wraps the dashboard's card list.  When `refreshTeams` is called,
 * it sends a one-shot WS `card-refresh` message to each affected
 * team's card room (so other clients update) AND calls `onRefreshTeam`
 * so the *current* client re-fetches each card.
 */
export function CrossTeamRefreshProvider({
  onRefreshTeam,
  children,
}: CrossTeamRefreshProviderProps) {
  const onRefreshTeamRef = useRef(onRefreshTeam);
  useEffect(() => {
    onRefreshTeamRef.current = onRefreshTeam;
  }, [onRefreshTeam]);

  const refreshTeams = useCallback(
    (teamIds: string[]) => {
      if (!teamIds || teamIds.length === 0) return;

      const wsUrl = getWsUrl();

      for (const teamId of teamIds) {
        // 1. Request a local re-fetch of the card
        onRefreshTeamRef.current(teamId);

        // 2. Broadcast to other clients in that team's room
        //    Open a short-lived WS just to send the message.
        //    (The alternative of opening a permanent multi-team WS is
        //    not needed — cross-team sync is rare and brief.)
        if (wsUrl) {
          try {
            const ws = new WebSocket(wsUrl);
            ws.onopen = () => {
              ws.send(JSON.stringify({ type: "join-card-room", body: { teamId } }));
              ws.send(JSON.stringify({ type: "card-refresh", body: { teamId } }));
              // Close after a short delay to allow the messages to flush
              setTimeout(() => ws.close(), 500);
            };
            ws.onerror = () => {
              try { ws.close(); } catch { /* ignore */ }
            };
          } catch {
            /* WS send failure is non-critical */
          }
        }
      }
    },
    []
  );

  return (
    <CrossTeamRefreshContext.Provider value={{ refreshTeams }}>
      {children}
    </CrossTeamRefreshContext.Provider>
  );
}
