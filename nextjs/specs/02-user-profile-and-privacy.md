# 02 — User Profile and Privacy (Updated)

## Purpose

Allow users to manage their profile information, configure field-level privacy, and view **email verification status**, including the ability to request a new verification email.

---

## User Stories Covered

- Edit my profile information
- Configure which profile fields are public
- See whether my account is verified
- Request a new verification email if needed
- View other users’ public profile information

---

## In Scope

- View/edit own profile
- Configure per-field visibility
- View other users’ public profiles
- Display and manage verification status

---

## Functional Requirements

### Profile Data

- Profile includes:
  - Required identifying fields (e.g. username)
  - Optional user-defined fields (not specified)
- User may edit their own profile fields.

---

### Privacy Settings

- Each optional profile field can be marked:
  - Public
  - Private
- Default visibility for optional fields must be defined by implementation.
- When viewing another user’s profile:
  - Only public fields are visible.

---

### Verification Status

- Profile must clearly display:
  - `Verified`
  - `Not verified`
- If user is **not verified**:
  - Profile provides an action to request a new verification email
  - Regenerated verification links must:
    - Invalidate previous tokens
    - Expire after 24 hours

---

## Permissions

- Only the profile owner can:
  - Edit profile fields
  - Change privacy settings
  - Request verification emails
- Other users can only view public profile data.

---

## Errors & Edge Cases

- Attempt to edit another user’s profile → forbidden
- User makes all optional fields private → minimal public identity remains (e.g. username)
- Repeated verification requests should be rate-limited if needed

---

## Acceptance Criteria

- Users can edit their own profile.
- Users can configure which fields are public.
- Users can see their verification status.
- Unverified users can request a new verification email.
- Other users only see public profile fields.
