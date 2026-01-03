# 01 — Authentication

## Purpose
Provide secure user registration, login, and email verification so users can access and protect their personal data.

## In Scope
- Register with username/email + password
- Login
- Email verification required to "confirm identity through email"
- Authorization so only the account owner can modify their personal data

## User Stories Covered
- Register creating a profile with username/email + password
- Login to see my profile
- Confirm identity through email
- Be the only one capable of modifying my personal data

## Functional Requirements
### Registration
- User submits: username, email, password.
- System validates:
  - username/email uniqueness
  - password meets minimum security policy (exact policy TBD)
- System creates user in a non-verified state.
- System sends a verification email with a single-use token or link.

### Email Verification
- User clicks verification link.
- System marks user as verified (e.g., sets `emailVerifiedAt`).
- Verification token must expire.

### Login
- User submits email/username + password.
- System authenticates and issues a session (cookie) or token.
- After login, user can access their profile.

### Access Control
- Endpoints/UI actions that modify personal data require authentication.
- A user may only modify resources they own (profile, personal resolutions, card state).

## Errors & Edge Cases
- Registration with existing email/username → reject with clear message.
- Login with invalid credentials → reject.
- Unverified email behavior:
  - Must still allow completing verification.
  - Whether login is blocked until verified is not specified; choose one and document in implementation.
- Expired/invalid verification token → show failure and allow re-send.

## Acceptance Criteria
- A new user can register and receives a verification email.
- Clicking verification marks the account verified.
- A verified user can login and view their profile.
- A user cannot modify another user's profile data.