# 07 — Proof and Approval

## Purpose
Enable a user to upload proof of completing a resolution and have team members approve or decline with comments.

## User Stories Covered
- Upload proof and ask team members for approval
- Team member can view uploaded proof and accept or decline with a comment

## In Scope
- Proof submission tied to a bingo cell
- Review workflow by other team members

## Functional Requirements
### Proof Upload
- A user can attach proof to a specific resolution cell.
- Upload triggers a "request approval" state.
- Supported file types/sizes are not specified; implementation must define constraints.

### Review
- Other team members can view the proof.
- A reviewer can:
  - approve
  - decline with a comment

### State Model (minimum)
- `no_proof` → `pending_review` → `approved` OR `declined`
- Decline requires a comment.

## Permissions
- Only the card owner can upload proof.
- Only team members (excluding the owner if desired) can approve/decline.

## Acceptance Criteria
- User can upload proof for a resolution.
- Other members can view the proof.
- Other members can approve.
- Other members can decline with a comment.