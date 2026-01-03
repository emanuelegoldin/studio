# 02 — User Profile and Privacy

## Purpose
Allow users to manage profile information and decide which fields are publicly visible.

## User Stories Covered
- Decide which information to make publicly available
- Be the only one capable of modifying my personal data

## In Scope
- View/edit own profile
- Configure per-field visibility (public/private)
- View other users' public profile info (within the app context)

## Functional Requirements
### Profile Data
- Profile contains user-identifying fields (at minimum username) plus optional fields (not specified).
- User can update their own profile fields.

### Privacy Settings
- User can mark profile fields as public or private.
- Default visibility for optional fields must be defined (implementation choice).

### Viewing Other Users
- When viewing another user's profile, only public fields are shown.

## Permissions
- Only the profile owner can edit their profile and privacy settings.

## Errors & Edge Cases
- Attempt to edit another user's profile → forbidden.
- If a user makes all optional fields private, only minimal public identity remains (e.g., username).

## Acceptance Criteria
- Users can edit their own profile.
- Users can configure which profile fields are public.
- Other users only see public fields.