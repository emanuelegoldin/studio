# 09 — Bingo Card Editing

## Purpose
Allow a card owner to update the *content* of a generated bingo card after the game has started, by replacing any non-joker cell with a compatible resolution.

This spec defines:
- UI edit mode behavior
- Allowed replacement sources
- Backend validation and persistence rules

## Spec References
- 03-personal-resolutions.md (personal resolutions list)
- 04-bingo-teams.md (member-provided resolutions)
- 05-bingo-card-generation.md (joker immutability)
- 06-bingo-gameplay.md (cell state model)

## In Scope
- Editing card content (resolution text and source metadata) for a card the user owns
- Editing empty filler cells
- Resetting edited cells back to `pending`

## Out of Scope
- Editing gameplay state via this flow (mark complete/undo)
- Editing the joker cell
- Adding a new “empty” option (clearing a cell)

## Definitions
- **Card owner**: the user whose `bingo_cards.user_id` matches the authenticated user.
- **Member-provided resolution**: a row in `team_provided_resolutions` where:
  - `team_id` equals the card's `bingo_cards.team_id`
  - `to_user_id` equals the card owner
- **Personal resolution**: a row in `resolutions` where `owner_user_id` is the card owner.

## Functional Requirements

### 1) Enter/Exit Edit Mode
- A user SHALL be able to enter an “edit mode” for a bingo card they own.
- While in edit mode, the user SHALL be able to exit edit mode when finished.

### 2) Selectable Cells in Edit Mode
- While in edit mode, the card owner SHALL be able to select **any non-joker cell**, including empty filler cells.
- The joker (center) cell SHALL NOT be modifiable.

### 3) Replacement Options
Upon selecting a cell, the user SHALL be prompted with a list of replacement options consisting of:
- All personal resolutions owned by the user: `GET /api/resolutions`
- All member-provided resolutions for the team associated to the card, **targeted to the current user**:
  - `GET /api/teams/[teamId]/resolutions?toUserId=<currentUserId>`
  - Returned items MUST be scoped to `team_id = card.team_id` and `to_user_id = card owner`

### 4) Apply or Cancel
- The user can either select a replacement option or cancel the operation.
- If the user cancels:
  - The modal closes
  - The user returns to the card still in edit mode

### 5) Persisting a Cell Edit
When a replacement option is selected:
- The system SHALL update the selected cell via `PUT /api/cells/[cellId]/edit`.
- The system SHALL update **all** of the following fields based on the selected option:
  - `bingo_cells.resolution_text`
  - `bingo_cells.source_type`
  - `bingo_cells.source_user_id`
  - `bingo_cells.is_empty`
- The system SHALL also reset `bingo_cells.state` to `pending`.
- If the selected option has no source user id, the system SHALL store `NULL` in `source_user_id`.

### 6) Permissions & Safety
- Only the card owner SHALL be able to edit the content of cells on their card.
- Attempts to edit the joker cell SHALL fail.

## Backend Rules

### `PUT /api/cells/[cellId]/edit`
Request body (JSON):
- `resolutionText: string` (required, non-empty)
- `sourceType: 'team' | 'member_provided' | 'personal' | 'empty'` (required)
- `sourceUserId: string | null` (optional; when omitted or null -> stored as NULL)
- `isEmpty: boolean` (required)

Validation:
- Auth required
- The authenticated user MUST be the card owner for the specified cell
- The specified cell MUST NOT be a joker cell

Effects:
- Update the cell content fields and set state to `pending`

### `GET /api/teams/[teamId]/resolutions?toUserId=...`
- Auth required
- The authenticated user MUST be a member of the team
- Returns the list of member-provided resolutions targeted to `toUserId`

## Acceptance Criteria
- A card owner can enter and exit edit mode.
- In edit mode, the owner can select any non-joker cell (including empty).
- On selection, the UI shows a list combining:
  - `GET /api/resolutions`
  - `GET /api/teams/[teamId]/resolutions?toUserId=<currentUserId>`
- Selecting an option updates the cell via `PUT /api/cells/[cellId]/edit`.
- Cancelling returns to the card still in edit mode.
- The joker cell cannot be modified (both UI and API enforce this).
- On edit, the cell updates `resolution_text`, `source_type`, `source_user_id` (NULL when absent), `is_empty`, and resets state to `pending`.
