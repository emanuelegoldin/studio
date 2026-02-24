# 01 — Authentication (Updated)

## Purpose

Provide secure user registration, login, and **email verification**, ensuring that only verified users can participate in team-based gameplay while still allowing basic account setup for unverified users.

---

## User Stories Covered

- Register creating a profile with username/email + password
- Login to see my profile
- Confirm identity through email
- See whether my account is verified
- Be restricted from team-based gameplay until verified
- Be the only one capable of modifying my personal data

---

## In Scope

- Registration
- Login
- Email verification workflow
- Verification-based access control
- Session or token-based authentication

---

## Functional Requirements

### Registration

- User submits:
  - Username
  - Email
  - Password
- System validates:
  - Username and email uniqueness
  - Password meets minimum security requirements
- System creates user in **unverified** state.
- System sends a verification email containing:
  - A single-use verification link
  - A verification token

---

### Email Verification

- Verification link:
  - Is single-use
  - Expires **24 hours** after creation
- When user clicks the link:
  - Token is validated
  - User account is marked as verified (e.g. `emailVerifiedAt` is set)
- Expired or invalid tokens:
  - Show a clear failure message
  - Allow the user to request a new verification email

---

### Login

- User submits email/username + password.
- System authenticates credentials.
- Login is **allowed for both verified and unverified users**.

---

### Verification-Based Access Control

Unverified users **may**:
- Log in
- View and edit their own profile
- Write and manage personal resolutions (inputs for bingo)

Unverified users **may not**:
- Create a team
- Join a team
- Accept team invitations
- Start bingo games or competitions
- Participate in any team-based gameplay

Verified users:
- Have full access to all team and gameplay features

Authorization checks must enforce these restrictions on all relevant endpoints.

---

## Errors & Edge Cases

- Registration with existing email or username → reject with clear message
- Login with invalid credentials → reject
- Verification token expired → allow regeneration
- Verification token reused → reject

---

## Acceptance Criteria

- A new user can register and receives a verification email.
- Verification link expires after 24 hours.
- Clicking a valid verification link marks the account as verified.
- Unverified users are blocked from team-based gameplay.
- Verified users can create, join, and participate in teams.
- A user cannot modify another user's data.

---

## Notes

- SMTP (soho) is used as the email provider.
- `.env.example` must document required email settings.
- Clarity and maintainability are prioritized over cleverness.
