# 05 — Bingo Card Generation

## Purpose
Define deterministic rules for generating each team member's bingo card when the team game is started.

## User Stories Covered
- Cards generated automatically at start
- Joker in the middle containing team resolution
- Other cells chosen from other team members' provided resolutions
- Missing resolutions filled randomly from the user's own resolution list
- If duplicates, user/provider can report and replace
- If not enough resolutions, fill with "empty" non-checkable cells

## Assumptions
- Card is a standard 5x5 grid.
- Center cell (row 3, col 3) is the Joker.

## Inputs
- Team resolution text (joker)
- Member-provided resolutions (from other members to the card owner)
- Card owner's personal resolutions (used as fallback)

## Generation Rules
1. Create a 5x5 grid.
2. Set center cell to Joker containing the team resolution.
3. Fill remaining 24 cells primarily from member-provided resolutions targeted to that user.
4. If fewer than 24 targeted member-provided resolutions are available, fill remaining cells by randomly selecting from the user's personal resolutions.
5. If still not enough resolutions to fill all remaining cells, fill with "empty" resolutions:
   - "empty" cells cannot be checked/marked completed.

## Duplicate Handling
- If a generated card contains duplicate resolution texts:
  - The card owner OR the member who provided the duplicated resolution can report it.
  - The reporter can provide an alternative resolution OR choose another from the card owner's personal resolution list.

## Constraints
- Joker cell is always present and immutable after start (text defined by team leader).
- Once generated, a card is associated with a specific team session (start event).

## Acceptance Criteria
- Starting the game generates a card for each team member.
- Center cell is the team resolution.
- Remaining cells follow selection and fallback rules.
- Duplicate reporting exists and results in a non-duplicate replacement.
- If insufficient content, "empty" non-checkable cells are used.