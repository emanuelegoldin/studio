# 00 — System Overview

## Goal
New Year Resolution Bingo is an application where users maintain personal resolutions, join teams, and play a team bingo game generated from team-wide and peer-provided resolutions.

## Scope (MVP per current requirements)
In scope:
- User accounts: register, login, email verification
- User profile: ability to manage personal data and decide what is public
- Personal resolutions CRUD
- Bingo teams: create team, invite/join, define one team resolution
- Team workflow: members create resolutions for other members; team leader starts game when ready
- Bingo card generation rules (joker in center; duplicate handling; filler rules)
- Proof upload + approval/decline with comment
- Gameplay marking (complete / to complete) and visibility of other users' cards
- Real-time-ish updates to other users in the group when a card changes (implementation can be polling/WebSocket; behavior is what matters)

Out of scope (not specified):
- Payments, achievements, leaderboards, analytics, notifications beyond email verification
- Social features beyond team invites and viewing
- Admin console

## Key Roles
- **User**: owns a profile, manages personal resolutions, participates in teams.
- **Team leader**: a user who created the team; can invite users, set team resolution, and start team bingo.
- **Team member**: invited/joined user; can create resolutions for other members; can approve proofs.

## Core Concepts / Data (logical)
- **User**
  - id
  - username
  - email
  - passwordHash
  - emailVerifiedAt
  - profile fields (some public, some private)
  - privacy settings
- **Resolution** (personal)
  - id, ownerUserId, text, createdAt, updatedAt
- **Team**
  - id, name, leaderUserId
  - teamResolutionText (the "joker" resolution)
  - status: `forming` | `started`
- **TeamMembership**
  - teamId, userId, role (`leader` or `member`), joinedAt
- **TeamProvidedResolution** (a resolution authored by one member for another member)
  - id, teamId, fromUserId, toUserId, text
- **BingoCard** (per team per user, generated at start)
  - id, teamId, userId
  - gridSize (assume 5x5 unless otherwise specified)
  - cells (25): each cell contains resolution text + metadata + state
- **BingoCellState**
  - `to_complete` | `completed`
  - proof attachment(s) (optional)
  - approval status (optional)

## Security & Permissions (high level)
- Authentication required for any user-specific operations.
- A user can modify only:
  - their own profile and privacy settings
  - their own personal resolutions
  - their own bingo card state (mark complete/to complete, upload proof)
- Team leader can:
  - create team, invite, start game, set team resolution
- Any team member can:
  - view other team members' bingo cards (once available per visibility rules)
  - approve/decline proofs for other members

## Primary Flows
1. Register → email verification → login
2. Create/update profile + choose public fields
3. Personal resolutions: add/update/delete
4. Team lifecycle: create team → invite/join members → members provide resolutions for each other → leader starts bingo
5. Card gameplay: mark completed / revert → upload proof → other members approve/decline with comment
6. Visibility: view others' cards; see updates when someone changes card state

## Non-Functional Requirements
- Data integrity: prevent duplicate entries in a generated card; support reporting duplicates and replacement.
- Auditability: keep who provided which resolution and who approved/declined.
- Privacy: honor per-field public/private settings for profile data.

## Open Questions (to confirm later)
- Bingo grid size: requirements imply a standard bingo card (5x5). If different, specify.
- How invitations work (email link, in-app notification, invite code) is not specified.
- Proof format (image, video, file types/size) is not specified.
- Real-time updates mechanism is not specified; only the observable behavior is required.