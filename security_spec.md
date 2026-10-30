# Firestore Security Specification

## 1. Data Invariants
- **User Profile Isolation:** A user profile at `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
- **Identity Integrity:** Reading sessions and saved fact-check audits in the user's subcollections must match `request.auth.uid`.
- **Relational Sync:** Every subcollection write (`/users/{userId}/reading_sessions/{sessionId}` and `/users/{userId}/audits/{auditId}`) requires that the parent `/users/{userId}` document exists and belongs to the authenticated user.
- **Strict Size and Schema Boundaries:** Titles, publishers, and IDs have bounded character lengths (`size() <= 300`) to prevent denial-of-wallet resource attacks.
- **Global Catch-All:** All undefined paths are strictly denied by default.

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. **Unauthenticated Read:** An unauthenticated user tries to read `/users/test-uid-123`. (Rejected by `isSignedIn()`)
2. **User Impersonation:** User A (`auth.uid: "user-a"`) tries to write a profile to `/users/user-b`. (Rejected by `userId == request.auth.uid`)
3. **Ghost Fields:** User tries to inject `isAdmin: true` into `/users/{userId}`. (Rejected by schema validation)
4. **ID Poisoning:** Document ID with special characters like `/users/{userId}/reading_sessions/../../hack`. (Rejected by `isValidId()`)
5. **Denial of Wallet:** User sends 5MB string in `reasoning` field. (Rejected by string size bounds)
6. **Negative Dwell Time:** Reading session with `dwellTimeSec: -50`. (Rejected by range bounds)
7. **Invalid Completion Ratio:** Reading session with `completionRatio: 2.5`. (Rejected by range bounds)
8. **Invalid Enum Value:** Reading session with `userFeedback: "malicious_script"`. (Rejected by enum validation)
9. **Cross-Tenant Reading Session Steal:** User A tries to read `/users/user-b/reading_sessions/{id}`. (Rejected by parent ownership)
10. **Tampering with Immutable User ID:** Updating session with mismatched `userId`. (Rejected by `incoming().userId == existing().userId`)
11. **Client Delegation Query Leak:** Unauthenticated user listing all audits across all users via collectionGroup query. (Rejected by missing collectionGroup rule)
12. **Blanket Collection Write:** User writing directly to root `/reading_sessions/{id}`. (Rejected by default-deny catch-all)
