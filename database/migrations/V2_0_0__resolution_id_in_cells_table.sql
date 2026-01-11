-- Replace resolution_text column in cells table with resolution_id foreign key
-- 1. Add resolution_id and team_provided_resolution_id columns
ALTER TABLE bingo_cells
  ADD COLUMN resolution_id VARCHAR(36) NULL,
  ADD COLUMN team_provided_resolution_id VARCHAR(36) NULL,
  ADD FOREIGN KEY (resolution_id) REFERENCES resolutions(id) ON DELETE SET NULL,
  ADD FOREIGN KEY (team_provided_resolution_id) REFERENCES team_provided_resolutions(id) ON DELETE SET NULL;
-- 2. Join resolution_text to resolutions table to get corresponding ids
UPDATE bingo_cells bc
JOIN resolutions r ON bc.resolution_text = r.text
SET bc.resolution_id = r.id;
-- 3. Join resolution_text to team_provided_resolutions to get corresponding ids
UPDATE bingo_cells bc
JOIN team_provided_resolutions tpr ON bc.resolution_text = tpr.text
SET bc.team_provided_resolution_id = tpr.id;
-- 4. Drop resolution_text column
ALTER TABLE bingo_cells
  DROP COLUMN resolution_text;