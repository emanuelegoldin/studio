# 04 — Bingo Teams (Updated)

## Purpose

Support team-based bingo gameplay with invitations, membership, and shared resolutions, **restricted to verified users only**.

---

## User Stories Covered

- Create a team and invite other users
- Join a team when invited
- Delete a team as leader
- Define a team resolution
- Create resolutions for other team members
- Start bingo once setup is complete

---

## In Scope

- Team creation
- Team deletion
- Invitations and joining
- Team membership and roles
- Team resolution definition
- Member-provided resolutions
- Bingo start conditions
- Verification-based access restrictions

---

## Functional Requirements

### Verification Requirement

All team-related actions require the user to be **verified**.

Unverified users:
- Cannot create teams
- Cannot join teams
- Cannot accept invitations
- Cannot start bingo games

---

### Team Creation

- A verified user can create a team.
- The creator becomes the team leader.

---

### Team Deletion

- A verified **team leader** can delete their team.
- Only the team leader can delete a team.
- Deletion is a **hard delete**.
- Due to database `ON DELETE CASCADE` constraints, deleting a team also deletes associated data, including:
  - Team memberships
  - Team invitations
  - Team-provided resolutions
  - Bingo cards and all dependent gameplay/proof/review records

---

### Invitations / Joining

- Team leader can invite users.
- Only verified users can accept invitations and join teams.
- Invitation mechanism is implementation-defined.

---

### Team Resolution (Joker Cell)

- Team leader defines one team-wide resolution.
- This resolution appears as the center joker cell on all team bingo cards.
- Joker cell is informational and not checkable.

---

### Member-Provided Resolutions

- For each team:
  - Each member must create a resolution for every **other** member.
- Members cannot create a resolution for themselves unless explicitly allowed by future specs.

---

### Start Conditions

- Team leader may start bingo only when:
  - All team members have provided resolutions for every other member
  - All participating members are verified

---

## Permissions

- Only verified users can participate in teams.
- Only team leader can:
  - Invite users
  - Define team resolution
  - Start the bingo game
  - Delete the team
- Team members can:
  - Provide resolutions for other members

---

## Acceptance Criteria

- Verified user can create a team.
- Verified invited users can join.
- Unverified users are blocked from all team actions.
- Team leader can define team resolution.
- Bingo cannot start until all required resolutions exist.
- Team leader can delete their team.
- Non-leaders cannot delete teams.

---

## Notes

- Verification checks must be enforced server-side.
- UI may hide or disable team actions for unverified users, but backend validation is mandatory.
