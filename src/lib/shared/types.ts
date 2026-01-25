// Team status
// Spec: 04-bingo-teams.md
export enum TeamStatus {
  FORMING = 'forming',
  STARTED = 'started'
}

// Team membership role
// Spec: 04-bingo-teams.md
export enum TeamRole{
  LEADER = 'leader',
  MEMBER = 'member'
}

// Team invitation status
// Spec: 04-bingo-teams.md
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

// Cell source type
// Spec: 05-bingo-card-generation.md
export enum CellSourceType {
  TEAM = 'team',
  MEMBER_PROVIDED = 'member_provided',
  PERSONAL = 'personal',
  EMPTY = 'empty'
}

// Cell state
// Spec: 06-bingo-gameplay.md, Resolution Review & Proof Workflow
export enum CellState {
  PENDING = 'pending',
  COMPLETED = 'completed',
  PENDING_REVIEW = 'pending_review',
  ACCOMPLISHED = 'accomplished'
}

// Proof status
// Spec: 07-proof-and-approval.md, AGENTS.md
export enum ProofStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined'
}

// Proof review decision
// Spec: 07-proof-and-approval.md
export enum ReviewDecision {
  APPROVED = 'approved',
  DECLINED = 'declined'
}

// Duplicate report status
// Spec: 05-bingo-card-generation.md
export enum DuplicateReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved'
}

// Review thread types
// Spec: Resolution Review & Proof Workflow
export enum ThreadStatus {
  OPEN = 'open', 
  CLOSED = 'closed'
}

export enum VoteType {
  ACCEPT = 'accept',
  DENY = 'deny'
}