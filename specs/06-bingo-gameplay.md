# 06 — Bingo Gameplay

## Purpose
Allow users to track progress on their bingo card by marking resolutions completed and undoing mistakes.

## User Stories Covered
- Update bingo card: mark completed / revert to to-complete
- See current state of my card

## In Scope
- Card state transitions per cell
- Display of card state

## Functional Requirements
### Card State
- Each non-empty, non-joker cell can be toggled between:
  - `to_complete`
  - `completed`
- If user mistakenly marked completed, they can revert to `to_complete`.

### Non-Checkable Cells
- "empty" filler cells cannot be marked completed.

### Joker Cell
- Center Joker cell is present; whether it is checkable is not specified.
  - Simplest interpretation: Joker is informational and not checkable.

## Permissions
- Only the card owner can change their card's cell states.
- Team members can view others' cards (subject to visibility spec).

## Acceptance Criteria
- User can mark a resolution completed.
- User can revert a completed resolution to to-complete.
- Empty cells cannot be checked.
- User can view their current card state.