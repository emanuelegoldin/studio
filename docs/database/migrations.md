## 2.0.2 - is_empty as Generated Column

A generated column allow us to ensure that the _is\_empty_ column of the _bingo\_cells_ table remains consistent upon insert and update operations.

- BOOL and BOOLEAN are synonims for TINYINT(1) in MariaDB
- A VIRTUAL generated column is not stored in the database; its value is computed only when necessary; a PERSISTENT generated column is stored as any regular column in the database.

## 2.0.3 - team_leaderboard Table

Adds a `team_leaderboard` table that persists per-user, per-team leaderboard
stats (`first_bingo_at`, `completed_tasks`) so the leaderboard API can read
directly from the table instead of computing values on every request.

- Unique key on `(user_id, team_id)`.
- Foreign keys to `users` and `teams` with `ON DELETE CASCADE`.
- Rows are bulk-initialized when a game starts and upserted on every cell state
  change.

## 2.0.4 - Fix is_empty Excludes Team Cells

Corrects the `is_empty` virtual generated column on `bingo_cells`.

The previous expression `(resolution_id IS NULL AND team_provided_resolution_id IS NULL)`
incorrectly flagged the team-goal cell as empty because it carries no FK to
either `resolutions` or `team_provided_resolutions` — it resolves its text
from `teams.team_resolution_text` via a JOIN at read time.

New expression: `(resolution_id IS NULL AND team_provided_resolution_id IS NULL AND source_type = 'empty')`

This ensures only cells explicitly inserted with `source_type = 'empty'` are
considered empty, while team-goal cells render normally.