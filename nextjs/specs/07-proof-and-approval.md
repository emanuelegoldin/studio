# 07 — Proof and Approval (Updated)

## Purpose

Enable team-based verification of completed resolutions through a structured **Resolution Review** process that includes proof submission, discussion, and voting.

This specification governs **proof, review, and approval workflows**, not basic bingo gameplay.

---

## User Stories Covered

- Request proof for another team member’s completed resolution
- Upload proof files for a completed resolution
- Discuss proof in a review thread
- Vote to accept or deny proof
- See resolution automatically finalized or reverted based on votes

---

## In Scope

- Proof request initiation
- Review thread lifecycle
- Messaging and file uploads
- Voting and automatic resolution state transitions
- Cleanup of review data upon completion or cancellation

---

## Review Trigger

- Proof review is **not automatic**.
- A review begins only when:
  - A resolution is in `COMPLETED` state
  - A **different team member** explicitly requests proof

Requesting proof:
- Creates a **Review Thread**
- Transitions resolution to `PENDING_REVIEW`

---

## Review Thread Model

Each review thread is associated with:
- One resolution
- The user who completed the resolution

### Thread Status

- `OPEN`
- `CLOSED`

---

## Proof Submission

### Completing User

- May upload proof files to the review thread.
- May write messages explaining or clarifying proof.
- Cannot vote.

### File Constraints

- Maximum file size: **5MB per file**
- File type validation follows existing system rules.
- Files are deleted permanently when the thread closes.

---

## Discussion

- All team members may post messages in the review thread.
- Messages are deleted permanently when the thread closes.

### Real-time Updates (WebSocket)

Thread messages are also propagated in real-time to other users currently viewing the same review thread.

- **Persistence remains HTTP-first**: the source of truth is still `POST /api/threads/[threadId]/messages`, which writes the message to MariaDB.
- **Realtime fanout is WebSocket-based**: after persistence, the client emits a minimal WS message so other connected viewers can update immediately.

#### Room Model

- Each review thread is treated as a **room**.
- The room id is the `threadId`.

#### WebSocket URL

- The client connects to `NEXT_PUBLIC_WS_URL`.
- If unset, the client defaults to `ws(s)://<current-host>:8080`.

#### WebSocket Messages

- `join-thread` (client → server): joins the socket to a thread room.
  - Body: `{ threadId: string }`
- `thread-message` (client → server): indicates a new message was posted.
  - Body: `{ threadId: string, username: string, content: string }`

#### Broadcast Payload (server → clients)

- Minimal payload: `{ username: string, content: string }`
- This payload is **non-authoritative** (no ids/timestamps). On receipt, clients should re-fetch the thread via `GET /api/threads/[threadId]` to display the persisted message with correct metadata.

---

## Voting & Approval

### Eligible Voters

- All team members **except** the completing user.
- Each voter has one vote per thread.
- Votes can be changed until thread closure.

### Vote Types

- `ACCEPT`
- `DENY`

---

### Voting Rules

- All eligible voters must vote.
- The thread closes automatically once all votes are submitted.

#### Outcome

- **≥ 50% ACCEPT**
  - Resolution transitions to `ACCOMPLISHED`

- **< 50% ACCEPT**
  - Resolution rolls back to `PENDING`

---

## Thread Closure & Cleanup

When a thread closes (automatically or via undo completion):

- Thread status becomes `CLOSED`
- All messages are deleted
- All uploaded proof files are deleted
- Resolution state is updated accordingly

---

## Permissions & Security

- Only team members may access review threads.
- Only the completing user may upload proof files.
- Completing user is blocked from voting.
- Duplicate votes per user are prevented.
- Authorization is enforced on all actions.

---

## Acceptance Criteria

- Proof review threads are created only when explicitly requested.
- Completing users can upload proof and participate in discussion.
- Other team members can vote and discuss.
- Votes can be changed before closure.
- Resolution state updates correctly based on voting outcome.
- Review data is fully deleted when threads close.

---

## Out of Scope

- UI styling and layout
- Notifications
- File preview or processing beyond storage

---

## Notes

- This workflow replaces the earlier “upload proof triggers review” model.
- Proof review is **collaborative, explicit, and vote-driven**.
- Declines do not require a dedicated comment field; discussion occurs in the thread.
