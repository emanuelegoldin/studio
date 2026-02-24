# 08 — Visibility and Updates

## Purpose
Let users view other users' bingo cards in the same competition context and ensure updates are visible to others after changes.

## User Stories Covered
- See my card state and other users' cards for users competing with me
- When I update my card, others in the group see my update

## In Scope
- Viewing other users' bingo cards (within a team)
- Propagating updates when card state changes

## Functional Requirements
### Visibility
- A team member can view the bingo cards of other members in the same team.
- Profile info shown alongside cards must respect profile privacy settings (see profile spec).

### Updates
- When a user changes their card state (mark complete/revert) or submits proof:
  - other team members should see the updated state.
- Implementation: WebSocket-based real-time propagation — see **11 — Real-Time Card Updates** for full details.
- The spec requirement is the observable behavior: updates become visible without requiring manual out-of-band coordination.

## Permissions
- Only team members can view team cards.
- Non-members cannot access team card data.

## Acceptance Criteria
- A user can view other team members' cards.
- When a member updates their card, other members can see the updated state.