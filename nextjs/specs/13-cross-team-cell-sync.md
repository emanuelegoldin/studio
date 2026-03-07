# 13 — Cross-Team Cell State Synchronization

## Purpose

Ensure that owner-driven cell state changes (mark completed, undo completion, auto-transitions from iterative/compound resolutions) propagate consistently across all bingo cards in every team where the same resolution appears, while keeping team-specific contest actions (proof requests, voting) scoped to a single card.

---

## User Stories Covered

- When I mark a resolution as completed in one team, all my cards in other teams with the same resolution also show it as completed.
- When I undo a completion, all my cards in other teams revert to pending (and any open review threads on those sibling cells are closed).
- When my iterative resolution reaches its target or my compound resolution has all subtasks done, all cells across all teams reflect the completed state.
- When my iterative counter drops below the threshold or a compound subtask is unchecked, all cells across all teams revert to pending.
- Proof requests and vote outcomes remain scoped to the team where the action was taken.

---

## In Scope

- Propagation of owner-driven completion (`pending → completed`) to sibling cells
- Propagation of owner-driven undo (any state → `pending`) to sibling cells, including review thread cleanup
- Extended `autoTransitionCellState` to handle revert from `pending_review` and `accomplished` states (with thread cleanup)
- Leaderboard refresh for all affected teams
- Returning affected team IDs in API responses for real-time WS broadcast

---

## Out of Scope

- Modifying proof request or voting workflows (these remain team-scoped)
- Server-side WS broadcast (the client handles card-refresh broadcasts using the returned team IDs)
- UI implementation changes (covered separately)

---

## Definitions

- **Sibling cells**: All `bingo_cells` rows that:
  - Share the same `resolution_id` (non-null) with the originating cell
  - Share the same `resolution_type`
  - Belong to a card owned by the same user (`bingo_cards.user_id`)
  - Are NOT the originating cell itself
- **Owner-driven action**: An action initiated by the resolution owner that reflects the ground truth of whether the resolution is completed.
- **Team-specific action**: An action initiated by a team member that is scoped to one team's bingo card (e.g., requesting proof, voting).

---

## Functional Requirements

### 1) Mark Completed — Cross-Team Propagation

When the owner marks a cell as completed (`pending → completed`), the system SHALL also transition all sibling cells from `pending` to `completed`.

- Sibling cells in `completed`, `pending_review`, or `accomplished` states are not changed (they are already at or beyond the completed stage).

### 2) Undo Completion — Cross-Team Propagation

When the owner undoes a completion (any completable state → `pending`), the system SHALL also:

1. Find all sibling cells in `completed`, `pending_review`, or `accomplished` state.
2. For each sibling cell in `pending_review`:
   - Close any open review thread (delete messages, delete files, set thread status to `closed`).
3. Transition all affected sibling cells to `pending`.
4. Refresh the leaderboard entry for each affected team/user combination.

### 3) Auto-Transition — Extended Revert

When `autoTransitionCellState` is called with `isComplete = false` (e.g., iterative counter dropped below threshold, compound subtask unchecked):

- The system SHALL transition cells from `completed`, `pending_review`, or `accomplished` to `pending` (currently only `completed → pending` is handled).
- For cells transitioning from `pending_review`, any open review thread SHALL be closed (with full cleanup).

### 4) Team-Specific Actions — No Change

The following actions SHALL continue to affect only the specific cell they target:

- `requestProof` (`completed → pending_review`)
- `submitVote` (thread closure → `accomplished` or `pending`)

### 5) API Response Enhancement

When a cell state change triggers cross-team propagation, the API response SHALL include an `affectedTeamIds` array containing the team IDs of all teams with sibling cells that were updated. This allows the client to broadcast `card-refresh` WebSocket messages to those teams' rooms.

---

## Identification of Sibling Cells

Sibling cells are identified by the SQL pattern:

```sql
SELECT c.id, c.state, bc.team_id, bc.user_id
FROM bingo_cells c
JOIN bingo_cards bc ON c.card_id = bc.id
WHERE c.resolution_id = :resolutionId
  AND c.resolution_type = :resolutionType
  AND bc.user_id = :cardUserId
  AND c.id != :originCellId
```

Only cells with a non-null `resolution_id` can have siblings. Cells with only `team_provided_resolution_id` are inherently team-scoped and have no siblings.

---

## Acceptance Criteria

- Marking a resolution completed in one team propagates the completed state to all sibling cells in other teams.
- Undoing a completion propagates the pending state to all sibling cells, closing any open review threads on those cells.
- `autoTransitionCellState` revert now handles cells in `pending_review` and `accomplished` states (with thread cleanup).
- Proof requests and voting remain scoped to one team's cell.
- Leaderboard entries are refreshed for all affected teams.
- API responses for `updateCellState` and `undoCompletion` include `affectedTeamIds`.
- No sibling propagation occurs for cells that only have `team_provided_resolution_id`.

---

## Relation to Other Specs

- **06 — Bingo Gameplay**: defines cell state transitions (extended here for cross-team propagation).
- **07 — Proof and Approval**: review thread lifecycle (thread cleanup reused for sibling undo).
- **11 — Real-Time Card Updates**: WebSocket card-refresh mechanism (extended to support multi-team broadcast via `affectedTeamIds`).
