# 05 — Bingo Card Generation

## Purpose
Define deterministic rules for generating each team member's bingo card when the team game is started.

## User Stories Covered
- Cards generated automatically at start
- Joker in the middle (fixed center cell)
- Other cells chosen from other team members' provided resolutions
- Missing resolutions filled randomly from the user's own resolution list
- If duplicates, user/provider can report and replace
- If not enough resolutions, fill with "empty" non-checkable cells

## Assumptions
- Card is a standard 5x5 grid.
- Center cell (row 3, col 3) is the Joker.

## Inputs
- Team resolution text (used as a normal "team" cell)
- Member-provided resolutions (from other members to the card owner)
- Card owner's personal resolutions (used as fallback)

## Data Model Notes
- Non-empty, non-joker cells should reference an existing resolution by id:
  - Personal cells reference the user's personal resolution id
  - Member-provided cells reference the team-provided resolution id
- The Joker is always the center cell (row 3, col 3) and is not stored in the database.
- The Joker's displayed text is a fixed "Joker" label (it does not display team resolution text).
- Storing references (instead of duplicating text) ensures that when a resolution text is edited, all cards displaying it reflect the update.

## Generation Rules
1. Create a 5x5 grid.
2. The center cell is the Joker (fixed, informational only).
3. Fill remaining 24 cells primarily from member-provided resolutions targeted to that user.
  - Additionally include the team resolution as a normal (checkable) "team" cell if there is space.
4. If fewer than 24 targeted member-provided resolutions are available, fill remaining cells by randomly selecting from the user's personal resolutions.
5. If still not enough resolutions to fill all remaining cells, fill with "empty" resolutions:
   - "empty" cells cannot be checked/marked completed.

## Duplicate Handling
- If a generated card contains duplicate resolutions (same referenced resolution id):
  - The card owner OR the member who provided the duplicated resolution can report it.
  - The reporter can provide an alternative resolution OR choose another from the card owner's personal resolution list.

## Constraints
- Joker cell is always present and immutable after start.
- Once generated, a card is associated with a specific team session (start event).

## Acceptance Criteria
- Starting the game generates a card for each team member.
- Center cell is the Joker.
- Remaining cells follow selection and fallback rules.
- Duplicate reporting exists and results in a non-duplicate replacement.
- If insufficient content, "empty" non-checkable cells are used.