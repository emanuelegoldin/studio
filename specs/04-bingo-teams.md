# 04 — Bingo Teams

## Purpose
Support team-based play: teams, invitations, membership, and a team-wide resolution.

## User Stories Covered
- Create a team and invite other users
- Define a team resolution that is the same for the whole team
- Invited user can join a team and publish their bingo card
- Teammember can create a resolution for every other teammember
- Teamleader can start bingo once all members created resolutions for all others

## In Scope
- Team creation
- Team invitations and joining
- Team membership
- Team leader role
- Team resolution definition
- Member-to-member resolution submissions (inputs for card generation)

## Functional Requirements
### Team Creation
- A user can create a team and becomes team leader.

### Invitations / Joining
- Team leader can invite users.
- Invited users can accept/join the team.
- The invitation mechanism (email link, invite code, in-app) is not specified; implementation may pick one.

### Team Resolution
- Team leader sets one team resolution text.
- This resolution is used as the center "joker" cell.

### Member-Provided Resolutions
- For a given team, each member can create a resolution for each other member.
- A member cannot create a "for myself" entry in this category (unless explicitly desired; not specified).

### Start Conditions
- Team leader can start the bingo only when:
  - all current team members have provided a resolution for every other member.

## Permissions
- Only team leader: invite users, set team resolution, start game.
- Team members: join team (if invited), create resolutions for other members.

## Acceptance Criteria
- Team leader can create a team and invite users.
- Invited users can join.
- Team leader can define the team resolution.
- Members can provide resolutions for each other.
- Leader cannot start until all required member-provided resolutions exist.