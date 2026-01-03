# 03 — Personal Resolutions

## Purpose
Allow users to manage a list of personal resolutions that can be used to fill their bingo card when needed.

## User Stories Covered
- Add, update, and delete resolutions

## In Scope
- CRUD for a user's personal resolutions

## Functional Requirements
### Create
- User can add a resolution (text).

### Read
- User can list and view their own resolutions.

### Update
- User can edit an existing resolution's text.

### Delete
- User can delete a resolution.

## Permissions
- Only the resolution owner can create/update/delete their own resolutions.

## Constraints
- Resolution text must be non-empty.
- Max length not specified; choose a reasonable limit in implementation.

## Acceptance Criteria
- User can create, edit, delete, and list their own resolutions.
- User cannot modify someone else's resolutions.