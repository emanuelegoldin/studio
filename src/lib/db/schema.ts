/**
 * Database Schema for Resolution Bingo
 * Spec Reference: 00-system-overview.md - Core Concepts / Data
 * 
 * This file contains the SQL schema for MariaDB.
 * Run this manually or use a migration tool to set up the database.
 */

export const schema = `
-- Users table
-- Spec: 00-system-overview.md - User entity
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- User profile table
-- Spec: 02-user-profile-and-privacy.md - Profile Data, Privacy Settings
CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  display_name VARCHAR(255) NULL,
  bio TEXT NULL,
  avatar_url VARCHAR(512) NULL,
  -- Per-field visibility: 1 = public, 0 = private
  display_name_public BOOLEAN DEFAULT TRUE,
  bio_public BOOLEAN DEFAULT FALSE,
  avatar_public BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email verification tokens
-- Spec: 01-authentication.md - Email Verification
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

-- User sessions
-- Spec: 01-authentication.md - Login, Access Control
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

-- Personal resolutions
-- Spec: 03-personal-resolutions.md - Resolution CRUD
CREATE TABLE IF NOT EXISTS resolutions (
  id VARCHAR(36) PRIMARY KEY,
  owner_user_id VARCHAR(36) NOT NULL,
  text VARCHAR(1000) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_user_id)
);

-- Teams
-- Spec: 04-bingo-teams.md - Team Creation, Team Resolution
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  leader_user_id VARCHAR(36) NOT NULL,
  team_resolution_text VARCHAR(1000) NULL,
  status ENUM('forming', 'started') DEFAULT 'forming',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Team memberships
-- Spec: 04-bingo-teams.md - Team Membership
CREATE TABLE IF NOT EXISTS team_memberships (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('leader', 'member') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_membership (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_user (user_id)
);

-- Team invitations
-- Spec: 04-bingo-teams.md - Invitations / Joining
CREATE TABLE IF NOT EXISTS team_invitations (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  invite_code VARCHAR(36) NOT NULL UNIQUE,
  invited_email VARCHAR(255) NULL,
  invited_user_id VARCHAR(36) NULL,
  status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_code (invite_code)
);

-- Team-provided resolutions (member-to-member)
-- Spec: 04-bingo-teams.md - Member-Provided Resolutions
CREATE TABLE IF NOT EXISTS team_provided_resolutions (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  from_user_id VARCHAR(36) NOT NULL,
  to_user_id VARCHAR(36) NOT NULL,
  text VARCHAR(1000) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_resolution (team_id, from_user_id, to_user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_to_user (to_user_id)
);

-- Bingo cards
-- Spec: 05-bingo-card-generation.md - BingoCard
CREATE TABLE IF NOT EXISTS bingo_cards (
  id VARCHAR(36) PRIMARY KEY,
  team_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  grid_size INT DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_card (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_team (team_id),
  INDEX idx_user (user_id)
);

-- Bingo card cells
-- Spec: 05-bingo-card-generation.md, 06-bingo-gameplay.md - BingoCellState
CREATE TABLE IF NOT EXISTS bingo_cells (
  id VARCHAR(36) PRIMARY KEY,
  card_id VARCHAR(36) NOT NULL,
  position INT NOT NULL, -- 0-24 for 5x5 grid
  resolution_text VARCHAR(1000) NOT NULL,
  is_joker BOOLEAN DEFAULT FALSE,
  is_empty BOOLEAN DEFAULT FALSE,
  source_type ENUM('team', 'member_provided', 'personal', 'empty') NOT NULL,
  source_user_id VARCHAR(36) NULL, -- who provided this resolution
  state ENUM('to_complete', 'completed') DEFAULT 'to_complete',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cell (card_id, position),
  FOREIGN KEY (card_id) REFERENCES bingo_cards(id) ON DELETE CASCADE,
  FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_card (card_id)
);

-- Proofs for bingo cells
-- Spec: 07-proof-and-approval.md - Proof Upload, State Model
CREATE TABLE IF NOT EXISTS cell_proofs (
  id VARCHAR(36) PRIMARY KEY,
  cell_id VARCHAR(36) NOT NULL,
  file_url VARCHAR(512) NULL,
  comment TEXT NULL,
  status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cell_id) REFERENCES bingo_cells(id) ON DELETE CASCADE,
  INDEX idx_cell (cell_id)
);

-- Proof reviews
-- Spec: 07-proof-and-approval.md - Review
CREATE TABLE IF NOT EXISTS proof_reviews (
  id VARCHAR(36) PRIMARY KEY,
  proof_id VARCHAR(36) NOT NULL,
  reviewer_user_id VARCHAR(36) NOT NULL,
  decision ENUM('approved', 'declined') NOT NULL,
  comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proof_id) REFERENCES cell_proofs(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_proof (proof_id)
);

-- Duplicate reports
-- Spec: 05-bingo-card-generation.md - Duplicate Handling
CREATE TABLE IF NOT EXISTS duplicate_reports (
  id VARCHAR(36) PRIMARY KEY,
  cell_id VARCHAR(36) NOT NULL,
  reporter_user_id VARCHAR(36) NOT NULL,
  replacement_text VARCHAR(1000) NULL,
  status ENUM('pending', 'resolved') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  FOREIGN KEY (cell_id) REFERENCES bingo_cells(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

export default schema;
