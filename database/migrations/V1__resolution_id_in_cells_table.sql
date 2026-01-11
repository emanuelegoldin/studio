-- Replace resolution_text column in cells table with resolution_id foreign key
ALTER TABLE cells
  DROP COLUMN resolution_text,
  ADD COLUMN resolution_id VARCHAR(36) NULL,
  ADD CONSTRAINT fk_resolution
    FOREIGN KEY (resolution_id)
    REFERENCES resolutions(id)
    ON DELETE SET NULL;