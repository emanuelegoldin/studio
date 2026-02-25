# 12 — Team Tabs, Members List & Leaderboard

## Purpose

Organise the team detail page into distinct tabs for better navigation and
separation of concerns: **Cards**, **Members**, and **Leaderboard**.

---

## User Stories Covered

- View all team bingo cards in a dedicated "Cards" tab.
- View a simple list of team members in a "Members" tab.
- View a leaderboard of bingo results in a "Leaderboard" tab.
- Click on any member's avatar to view their profile.
- See a confetti animation when a bingo line is completed.
- See how many resolutions each player has accomplished in the leaderboard.

---

## In Scope

- Team detail page tab structure
- Members list UI
- Leaderboard table backed by the `team_leaderboard` DB table
- Clickable user avatars linking to profile pages
- Clickable source-user badges in bingo card cells
- Confetti celebration animation on bingo completion
- Public profile page for non-owners

---

## Tab Structure

The team detail page header (team name, status, leader actions, dialogs) remains
above the tabs. Below it, three tabs are rendered:

### 1. Cards Tab

- Shows every team member's bingo card (existing functionality moved here).
- Owner's card is interactive (mark completed, undo, edit mode, etc.).
- Other members' cards are view-only.
- If the game has not started, a placeholder message is shown.
- **Confetti animation:** When a cell state change causes a bingo line (row,
  column, or diagonal) to be completed for the first time, a confetti animation
  plays from the top of the screen.
  - The animation does **not** trigger when the only state transitions are
    `completed → pending_review` (i.e. proof being requested by another member).
  - The confetti is CSS-based and self-destructs after ~3.5 seconds.
- **Clickable source-user badges:** On each cell, the badge showing the
  resolution source user (for `member_provided` cells) is a link to that
  user's profile page.

### 2. Members Tab

- A simple list of all team members.
- Each row contains:
  - **Avatar** on the left (clickable → navigates to the member's profile).
  - **Username / display name** in the centre.
  - A "Leader" badge for the team leader.
- The current user's entry is annotated with "(You)".

### 3. Leaderboard Tab

- A table with four columns:
  1. **#** — Position number (1-indexed). Position 1 is gold-coloured, 2 is
     silver, 3 is bronze.
  2. **Player** — Avatar (clickable) + display name / username.
  3. **Completed** — The number of completed resolutions (cells with state
     `completed` or `accomplished`).
  4. **First Bingo** — The datetime when the player first completed a bingo
     line, or "—" if not yet scored.
- **Sorting rules (applied in order):**
  1. Users who have scored a bingo appear before those who have not.
  2. Among users with a bingo, order by earliest `first_bingo_at` ascending.
  3. Ties (same `first_bingo_at`, or both NULL) are broken by `completed_tasks`
     descending (more completed resolutions = higher rank).
  4. Final tiebreaker: alphabetical by username ascending.
- **Data source:** All values are read from the persisted `team_leaderboard`
  table (see _Database Impact_ below), not computed on the fly.

---

## Clickable Avatars & Public Profile

- Clicking a member's avatar anywhere in the team page (Cards, Members,
  Leaderboard tabs) navigates to `/profile/[userId]`.
- Clicking the source-user badge on a bingo card cell (for `member_provided`
  resolutions) also navigates to `/profile/[userId]`.
- **If the viewer is the profile owner**, they are redirected to the editable
  profile page at `/profile`.
- **If the viewer is not the owner**, they see a read-only public profile
  showing:
  - Username (always visible).
  - Display name (visible only if the user set `displayNamePublic = true`).
  - Bio (visible only if the user set `bioPublic = true`).

---

## API Endpoints

### `GET /api/teams/[teamId]/leaderboard`

Returns the leaderboard for a team.

**Auth:** Required. Caller must be a member of the team.

**Response:**
```json
{
  "leaderboard": [
    {
      "userId": "string",
      "username": "string",
      "displayName": "string | null",
      "firstBingoAt": "ISO-8601 string | null",
      "completedTasks": "number"
    }
  ]
}
```

### `GET /api/profile?userId=xxx` (existing)

Returns public profile data for a given user.

---

## Database Impact

### `team_leaderboard` table (new)

Persists per-user, per-team leaderboard data for efficient retrieval.

| Column           | Type         | Notes                                    |
| ---------------- | ------------ | ---------------------------------------- |
| `user_id`        | VARCHAR(36)  | FK → `users.id` ON DELETE CASCADE        |
| `team_id`        | VARCHAR(36)  | FK → `teams.id` ON DELETE CASCADE        |
| `first_bingo_at` | DATETIME     | NULL until the user scores a bingo       |
| `completed_tasks`| INT          | Count of cells in state `completed` or `accomplished` |
| `updated_at`     | DATETIME     | Auto-updated on change                   |

- **Unique key:** `(user_id, team_id)`
- **Migration:** `V2_0_3__team_leaderboard_table.sql`

#### When rows are written

- **Game start** (`POST /api/teams/[teamId]/start`): bulk-inserts a row for
  every team member with `completed_tasks = 0` and `first_bingo_at = NULL`.
- **Cell state change** (`updateCellState`, `undoCompletion`): recalculates
  `completed_tasks` and `first_bingo_at` from `bingo_cells` and upserts.
- **Proof request** (`requestProof` — `completed → pending_review`): refreshes
  the row because `pending_review` does not count toward `completed_tasks`.
- **Vote resolution** (`submitVote` — thread closes): refreshes the row after
  the cell transitions to `accomplished` or reverts to `pending`.

#### Bingo detection logic

- A "bingo" is a complete row, column, or diagonal on the 5×5 grid.
- A cell counts as "done" when its state is `completed` or `accomplished`, or
  when it is the centre joker cell.
- The first-bingo time equals the latest `updated_at` among the cells of the
  earliest completed line.

---

## Acceptance Criteria

- [ ] Team detail page renders three tabs: Cards, Members, Leaderboard.
- [ ] Cards tab contains the existing bingo-card layout.
- [ ] Members tab lists all team members with avatar and username.
- [ ] Leaderboard tab shows a ranked table with first-bingo datetime.
- [ ] Leaderboard tab shows a "Completed" column counting cells with state
      `completed` or `accomplished`.
- [ ] Leaderboard sorts by: bingo-holders first (earliest bingo), then by
      completed tasks descending, then alphabetically.
- [ ] Positions 1 / 2 / 3 are coloured gold / silver / bronze.
- [ ] Clicking any avatar navigates to the member's profile.
- [ ] Clicking a source-user badge in a bingo cell navigates to the profile.
- [ ] Confetti animation plays when a bingo line is newly completed.
- [ ] Confetti does not play on completed → pending_review transitions.
- [ ] Profile owners are redirected to the editable profile page.
- [ ] Non-owners see only public profile fields.

---

## Out of Scope

- Real-time leaderboard updates via WebSocket (future enhancement).
