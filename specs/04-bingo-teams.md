# 04 — Bingo Teams (Updated)

## Purpose

Support team-based bingo gameplay with invitations, membership, and shared resolutions, **restricted to verified users only**.

---

## User Stories Covered

- Create a team and invite other users
- Join a team when invited
- Define a team resolution
- Create resolutions for other team members
- Start bingo once setup is complete

---

## In Scope

- Team creation
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
- Team members can:
  - Provide resolutions for other members

---

## Acceptance Criteria

- Verified user can create a team.
- Verified invited users can join.
- Unverified users are blocked from all team actions.
- Team leader can define team resolution.
- Bingo cannot start until all required resolutions exist.

---

## Notes

- Verification checks must be enforced server-side.
- UI may hide or disable team actions for unverified users, but backend validation is mandatory.
