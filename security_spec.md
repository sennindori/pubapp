# Security Specification - メモハック

## Data Invariants
1. A record must belong to the authenticated user's subcollection.
2. Labels must be an array of strings with a maximum of 8 slots.
3. Timestamps (updatedAt, registeredAt) must be server-validated.

## The "Dirty Dozen" Payloads (Red Team Audit)
1. Unauthorized profile read (reading another user's labels).
2. Unauthorized profile write (updating another user's labels).
3. Shadow field injection in profile (adding `isAdmin: true`).
4. Record creation for another user.
5. Record creation without mandatory fields (missing `count` or `hours`).
6. Extreme value injection (setting `count` to 999999999).
7. Resource poisoning via ID (1MB string as record ID).
8. Bypassing termnial state (if applicable, but not here).
9. Self-assignment of ownership (changing own `userId`).
10. Orphaned record (creating a record without a user profile - allowed if profile is lazy-created).
11. PII leak (reading user profile email if stored - we don't store email in firestore).
12. Identity Spoofing (setting `ownerId` in record data to another user).

## Test Runner (Conceptual)
All tests must verify `PERMISSION_DENIED` for the above scenarios.
