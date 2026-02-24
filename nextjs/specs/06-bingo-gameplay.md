# 06 — Bingo Gameplay (Updated)

## Purpose

Allow users to track progress on their bingo card by marking resolutions as completed or undoing mistakes, while accurately reflecting resolution states that may be impacted by team-based proof review.

This specification focuses on **card interaction and resolution state changes**, not on proof submission or review mechanics.

---

## User Stories Covered

- Mark a resolution as completed on my bingo card
- Undo a mistakenly marked completion
- View my own bingo card state
- View other team members’ bingo card states
- See when a resolution is under review or finalized

---

## In Scope

- Bingo card cell state transitions
- Resolution completion and undo flows
- Mapping resolution states to UI-visible card states
- Permissions for interacting with card cells

---

## Resolution & Card States

Each non-empty, non-joker bingo cell is backed by a **Resolution** entity.

### Resolution States

- `PENDING`  
  Default state. Resolution has not been completed.

- `COMPLETED`  
  Resolution marked completed by the card owner. Proof has **not** been requested.

- `PENDING_REVIEW`  
  Proof has been requested by another team member and is under review.

- `ACCOMPLISHED`  
  Proof has been accepted and the resolution is finalized.

---

## Card Display Rules (Backend-Supported)

- **Green cell**
  - `COMPLETED`
  - `ACCOMPLISHED`

- **Yellow cell**
  - `PENDING_REVIEW`

- **Default / unmarked**
  - `PENDING`

The frontend relies on API-provided resolution state to render cells correctly.

---

## Functional Requirements

### Mark Resolution as Completed

- Only the card owner can mark a resolution as completed.
- Marking completion transitions:
  - `PENDING` → `COMPLETED`
- No proof or review is triggered automatically.

---

### Undo Completion

- The card owner may undo a completion at any time.
- Undoing:
  - Transitions resolution back to `PENDING`
  - Closes any open proof review thread
  - Permanently deletes all associated review messages and files

---

### Viewing Other Cards

- Team members can view other users’ bingo cards.
- Team members **cannot** modify others’ resolution states.
- From a viewed card:
  - A `COMPLETED` cell may allow requesting proof (handled in spec 07)
  - A `PENDING_REVIEW` cell may be opened to view the review thread

---

## Non-Checkable Cells

- Empty filler cells cannot be marked completed.
- The center Joker cell is informational only and not checkable.

---

## Permissions

- Only the card owner can:
  - Mark a resolution completed
  - Undo completion
- Team members can:
  - View other cards
  - Initiate proof review flows (see spec 07)

---

## Acceptance Criteria

- User can mark a resolution completed.
- User can undo a completed resolution.
- Empty and joker cells are not checkable.
- Resolution states are accurately reflected on the bingo card.
- Review-related states do not break card interaction.

---

## Out of Scope

- Proof upload
- Review threads, voting, or comments
- Approval logic

These concerns are handled in **07 — Proof and Approval**.
