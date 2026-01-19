# Merge Request Clone Implementation Progress

> **Agent Instructions**: Read this file at the start of each session. Update after completing each step.

## Current Status

**Phase**: Phase 5 Complete - Frontend Integration
**Last Updated**: 2026-01-19
**Last Step Completed**: Phase 5.6 - Added sync status indicators and linked MR info display

---

## Task Checklist

### Phase 1: Extend Data Models
- [x] 1.1 Extend PullRequest model with originalPrId, clonedPrIds, isCloned fields
- [x] 1.2 Extend Comment model with originalCommentId field
- [x] 1.3 Create Approval model and approvals.json data store

### Phase 2: Create MR Clone Service
- [x] 2.1 Create MRCloneService with clone operations
- [x] 2.2 Implement cloneMergeRequests() method
- [x] 2.3 Implement cloneComments() and cloneApprovals() methods
- [x] 2.4 Integrate MRCloneService with RepositoryService.clone()

### Phase 3: Implement Deletion Constraints
- [x] 3.1 Add delete() method to PullRequestService with validation
- [x] 3.2 Add DELETE /:id route to pullRequest.routes.ts
- [x] 3.3 Add delete() controller method with 403 response for linked MRs
- [x] 3.4 Add MR_DELETION_BLOCKED_MESSAGE constant

### Phase 4: Implement Status Synchronization
- [x] 4.1 Create MRSyncService with sync methods
- [x] 4.2 Implement syncStatus() for bidirectional status propagation
- [x] 4.3 Implement syncComments() for comment propagation
- [x] 4.4 Hook sync into PullRequestService.updateStatus()
- [x] 4.5 Hook sync into PullRequestService.addComment()

### Phase 5: Frontend Integration
- [x] 5.1 Update frontend api.types.ts with clone fields and Approval interface
- [x] 5.2 Add delete() method to frontend PullRequestService
- [x] 5.3 Update MergeRequestsList with clone indicator badges
- [x] 5.4 Add delete button with conditional disabled state
- [x] 5.5 Update MergeRequestsView with linked MR info display
- [x] 5.6 Add sync status indicators and manual sync button

### Phase 6: Polish and UX
- [ ] 6.1 Add toast notifications for sync and delete operations
- [ ] 6.2 Add keyboard shortcuts (d for delete, s for sync)
- [ ] 6.3 Create MRCloneService.test.ts with unit tests
- [ ] 6.4 Create MRSyncService.test.ts with unit tests

---

## Files Created/Modified

| File | Status | Notes |
|------|--------|-------|
| `backend/src/models/PullRequest.ts` | ✅ Complete | Added originalPrId, clonedPrIds, isCloned |
| `backend/src/models/Comment.ts` | ✅ Complete | Added originalCommentId |
| `backend/src/models/Approval.ts` | ✅ Complete | NEW - Approval interface created |
| `backend/data/approvals.json` | ✅ Complete | NEW - Empty array data store created |
| `backend/src/services/MRCloneService.ts` | ✅ Complete | NEW - Clone operations implemented |
| `backend/src/services/MRSyncService.ts` | ✅ Complete | NEW - Sync operations implemented |
| `backend/src/services/PullRequestService.ts` | ✅ Complete | Added delete(), modified updateStatus() and addComment() |
| `backend/src/services/RepositoryService.ts` | ✅ Complete | Integrated MR cloning |
| `backend/src/controllers/PullRequestController.ts` | ✅ Complete | Added delete() controller |
| `backend/src/routes/pullRequest.routes.ts` | ✅ Complete | Added DELETE route |
| `backend/src/config/constants.ts` | ✅ Complete | Added deletion message constant |
| `frontend/src/types/api.types.ts` | ✅ Complete | Added clone fields, Approval type |
| `frontend/src/services/PullRequestService.ts` | ✅ Complete | Added deletePR() method |
| `frontend/src/services/ApiClient.ts` | ✅ Complete | Delete method already exists |
| `frontend/src/components/MergeRequestsList.tsx` | ✅ Complete | Clone badges, delete button added |
| `frontend/src/components/MergeRequestsView.tsx` | ✅ Complete | Linked MR info, sync status added |
| `backend/src/__tests__/services/MRCloneService.test.ts` | ⏳ Pending | NEW - Unit tests (Phase 6) |
| `backend/src/__tests__/services/MRSyncService.test.ts` | ⏳ Pending | NEW - Unit tests (Phase 6) |

---

## Key Decisions Made

_Record important architectural or design decisions here._

1. **Clone tracking fields**: Added `originalPrId`, `clonedPrIds`, and `isCloned` to PullRequest model for bidirectional tracking
2. **Deletion constraints**: Cloned MRs cannot be deleted directly - must delete original first. Original MRs with clones will orphan the clones when deleted.
3. **Sync behavior**: Status and comments sync bidirectionally with `skipSync` flag to prevent infinite recursion
4. **Frontend delete method**: Renamed to `deletePR()` to avoid conflict with base class `delete()` method

---

## Blockers / Issues

_Record any blockers or issues encountered._

1. None yet

---

## Context for Next Session

_Brief summary of what was being worked on and next steps._

**Next Step**: Phase 6 - Polish and UX
- Add toast notifications for sync and delete operations
- Add keyboard shortcuts (d for delete, s for sync)
- Create MRCloneService.test.ts with unit tests
- Create MRSyncService.test.ts with unit tests

**Important Files to Review**:
- `plans/mr-clone-implementation.md` - Full implementation plan (THIS PLAN'S COMPANION)
- `plans/gitlab-clone-implementation.md` - Reference for existing patterns
- `DESIGN.md` - Design system tokens (must follow exactly)
- `backend/src/models/PullRequest.ts` - Current PR model to extend
- `backend/src/models/Comment.ts` - Current Comment model to extend
- `backend/src/services/PullRequestService.ts` - Service to modify

**Commands to Start**:
```bash
cd hellbender-ai-code-review
# Backend is in ./backend, Frontend is in ./frontend
```

---

## Sync Behavior Reference

When implementing sync logic, follow these rules:

### Status Sync
- **Original -> Clones**: When original status changes, propagate to all clones
- **Clone -> Original -> Other Clones**: When clone status changes, update original, then propagate to siblings
- **Use skipSync flag**: Prevent infinite recursion during propagation

### Comment Sync
- **Original -> Clones**: New comment on original creates copies on all clones
- **Clone -> Original**: New comment on clone creates copy on original (with originalCommentId)
- **Track with originalCommentId**: Enables future edit/delete sync

### Deletion Rules
- **Cloned MR**: BLOCKED - Return 403 with MR_DELETION_BLOCKED_MESSAGE
- **Original with clones**: ALLOWED - Orphan all clones first (set originalPrId to null)
- **Original without clones**: ALLOWED - Direct delete
- **Orphaned clone**: ALLOWED - Was unlinked when original was deleted
