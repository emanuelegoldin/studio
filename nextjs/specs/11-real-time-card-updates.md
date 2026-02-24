# 11 — Real-Time Card Updates

## Purpose

Ensure that bingo card state changes made by one team member are immediately visible to all other team members without requiring a manual page refresh.

This specification covers:
- **Real-time propagation** of cell state changes across team members via WebSocket.
- **Conflict resolution** when concurrent operations target the same cell.

It extends the visibility requirements in **08 — Visibility and Updates** by prescribing a concrete WebSocket-based mechanism rather than leaving the approach unspecified.

---

## User Stories Covered

- When a team member marks a resolution as completed, other members see the change in real time.
- When a team member undoes a completion, other members see the revert in real time.
- When a team member requests proof, the card owner sees the cell move to "pending review" in real time.
- When a vote closes a review thread, all members see the resulting cell state change in real time.
- When a card cell is edited (content swap), other members see the updated card in real time.
- When two users perform conflicting actions on the same cell concurrently, a deterministic winner is chosen to prevent inconsistent state.

---

## In Scope

- Card-level WebSocket rooms
- Real-time card refresh via WebSocket messages
- Optimistic locking (state precondition guards) on cell mutations
- Conflict resolution rules

---

## Architecture Overview

### Room Model

Each bingo card interaction uses a **team-level WebSocket room**.

- **Room key**: `card:<teamId>`
- Every `BingoCard` component instance opens a WebSocket connection on mount and joins the room for its `teamId`.
- When any client persists a cell mutation, it sends a `card-refresh` message. The WebSocket server broadcasts a `refresh-card` event to all other sockets in the room.
- On receipt, clients call their `onRefresh` callback to re-fetch card data from the API.

This complements the existing **thread-level rooms** (keyed by `threadId`) used for real-time review thread updates (see spec 07).

### WebSocket Messages

| Message           | Direction         | Body                  | Purpose                                      |
|-------------------|-------------------|-----------------------|----------------------------------------------|
| `join-card-room`  | client → server   | `{ teamId: string }`  | Join the team-level card room.               |
| `card-refresh`    | client → server   | `{ teamId: string }`  | Signal that a cell state change was persisted.|
| `refresh-card`    | server → clients  | `{}`                  | Tells viewers to re-fetch card data.         |

### WebSocket URL

Same as existing thread WebSocket — the client connects to `ws(s)://<current-host>/ws`.

---

## When Card-Refresh Is Broadcast

A `card-refresh` message is sent by the acting client immediately after any of these operations:

| Operation                   | Component / Dialog            | Trigger                                          |
|-----------------------------|-------------------------------|--------------------------------------------------|
| Mark resolution completed   | `MarkCellCompleteDialog`      | After `onUpdate` callback fires                  |
| Undo completion             | `ResolutionCell` (click handler) | After `onUpdate` callback fires               |
| Request proof               | `RequestProofDialog`          | After API returns 201 and `onRefresh` fires       |
| Vote on review thread       | `CellThreadDialog` / `VoteBar`| After vote API returns (may close thread)         |
| Edit cell content           | `EditCellDialog`              | After edit API returns 200 and `onRefresh` fires  |

---

## Conflict Resolution

### Problem

Two concurrent operations may target the same cell:

1. **Owner undoes completion** (`POST /api/cells/:id/undo-complete`)  
   while simultaneously  
2. **Team member requests proof** (`POST /api/cells/:id/request-proof`)

Without protection, both operations could succeed based on stale reads, leaving the cell in an inconsistent state.

### Solution — Optimistic Locking via State Precondition Guards

Each mutation that changes `bingo_cells.state` includes a `WHERE state = <expected>` guard:

| Operation         | Expected state(s)                          | Target state      |
|-------------------|--------------------------------------------|-------------------|
| Mark completed    | `pending`                                  | `completed`       |
| Undo completion   | `completed`, `pending_review`, `accomplished` | `pending`       |
| Request proof     | `completed`                                | `pending_review`  |
| Vote → accomplished | `pending_review`                          | `accomplished`    |
| Vote → reverted   | `pending_review`                           | `pending`         |

If `affectedRows === 0`, the cell was already transitioned by another operation. The API returns an error, and the client receives an appropriate message prompting a refresh.

### Owner-Prevails Rule

When the owner undoes completion and a team member requests proof concurrently:

- **Owner's undo** runs inside a transaction that first closes any open review thread, then sets state to `pending` with `WHERE state IN ('completed', 'pending_review', 'accomplished')`.
- **Team member's proof request** guards the state transition with `WHERE state = 'completed'`.

Because the undo accepts a wider set of source states and closes the thread in the same transaction, **the owner's action always succeeds** regardless of ordering. The proof request either:
- Succeeds first (cell moves to `pending_review`), then the undo succeeds and reverts it.
- Fails because the cell is already `pending` (the undo completed first).

In both cases the final state is `pending`, honouring the owner's intent.

---

## Component Responsibilities

### `BingoCard` (bingo-card.tsx)

- Opens a WebSocket connection on mount; joins `card:<teamId>`.
- Provides a `CardWsContext` React context (available for future use by child components if needed).
- **Wraps `onCellUpdate` and `onRefresh`** before passing them to children: after the (potentially-async) parent callback completes, the wrapper sends a `card-refresh` WS message. This guarantees the DB mutation has landed before the broadcast goes out, preventing stale reads on other clients.
- Listens for incoming WS messages and calls the **raw** (unwrapped) `onRefresh` to reload locally — this avoids an infinite broadcast loop.
- Cleans up the WebSocket on unmount.

### Child Components

Child components (`ResolutionCell`, `MarkCellCompleteDialog`, `RequestProofDialog`, `EditCellDialog`, `CellThreadDialog`) simply call `onUpdate` / `onRefresh` as normal. They do **not** need to broadcast explicitly — the wrapped callbacks handle it automatically.

---

## Acceptance Criteria

- When a team member changes a cell state, other members viewing the same team see the update within seconds without refreshing the page.
- If two users perform conflicting operations, the system resolves the conflict deterministically (owner's action prevails).
- Failed operations due to state conflicts return a descriptive error to the acting user.
- No WebSocket connection is leaked on component unmount.
- The WebSocket server correctly isolates card rooms from thread rooms (different key prefixes).

---

## Out of Scope

- Offline support / retry queues.
- Granular cell-level diffing (clients re-fetch the full card).
- Push notifications for card changes.

---

## Relation to Other Specs

- **06 — Bingo Gameplay**: defines cell state transitions.
- **07 — Proof and Approval**: defines thread-level real-time messaging (thread rooms).
- **08 — Visibility and Updates**: high-level requirement that updates become visible; this spec prescribes the WebSocket implementation.
- **09 — Bingo Card Editing**: edit operations broadcast via the same mechanism.
