# Merge Request Clone Implementation Progress

> **Agent Instructions**: Read this file at the start of each session. Update after completing each step.

## Current Status

**Phase**: Not Started
**Last Updated**: 2026-01-19
**Last Step Completed**: None

---

## Task Checklist

### Phase 1: Extend Data Models
- [ ] 1.1 Extend PullRequest model with originalPrId, clonedPrIds, isCloned fields
- [ ] 1.2 Extend Comment model with originalCommentId field
- [ ] 1.3 Create Approval model and approvals.json data store

### Phase 2: Create MR Clone Service
- [ ] 2.1 Create MRCloneService with clone operations
- [ ] 2.2 Implement cloneMergeRequests() method
- [ ] 2.3 Implement cloneComments() and cloneApprovals() methods
- [ ] 2.4 Integrate MRCloneService with RepositoryService.clone()

### Phase 3: Implement Deletion Constraints
- [ ] 3.1 Add delete() method to PullRequestService with validation
- [ ] 3.2 Add DELETE /:id route to pullRequest.routes.ts
- [ ] 3.3 Add delete() controller method with 403 response for linked MRs
- [ ] 3.4 Add MR_DELETION_BLOCKED_MESSAGE constant

### Phase 4: Implement Status Synchronization
- [ ] 4.1 Create MRSyncService with sync methods
- [ ] 4.2 Implement syncStatus() for bidirectional status propagation
- [ ] 4.3 Implement syncComments() for comment propagation
- [ ] 4.4 Hook sync into PullRequestService.updateStatus()
- [ ] 4.5 Hook sync into PullRequestService.addComment()

### Phase 5: Frontend Integration
- [ ] 5.1 Update frontend api.types.ts with clone fields and Approval interface
- [ ] 5.2 Add delete() method to frontend PullRequestService
- [ ] 5.3 Update MergeRequestsList with clone indicator badges
- [ ] 5.4 Add delete button with conditional disabled state
- [ ] 5.5 Update MergeRequestsView with linked MR info display
- [ ] 5.6 Add sync status indicators and manual sync button

### Phase 6: Polish and UX
- [ ] 6.1 Add toast notifications for sync and delete operations
- [ ] 6.2 Add keyboard shortcuts (d for delete, s for sync)
- [ ] 6.3 Create MRCloneService.test.ts with unit tests
- [ ] 6.4 Create MRSyncService.test.ts with unit tests

---

## Files Created/Modified

| File | Status | Notes |
|------|--------|-------|
| `backend/src/models/PullRequest.ts` | Pending | Add originalPrId, clonedPrIds, isCloned |
| `backend/src/models/Comment.ts` | Pending | Add originalCommentId |
| `backend/src/models/Approval.ts` | Pending | NEW - Approval interface |
| `backend/data/approvals.json` | Pending | NEW - Empty array data store |
| `backend/src/services/MRCloneService.ts` | Pending | NEW - Clone operations |
| `backend/src/services/MRSyncService.ts` | Pending | NEW - Sync operations |
| `backend/src/services/PullRequestService.ts` | Pending | Add delete(), modify updateStatus() |
| `backend/src/services/RepositoryService.ts` | Pending | Integrate MR cloning |
| `backend/src/controllers/PullRequestController.ts` | Pending | Add delete() controller |
| `backend/src/routes/pullRequest.routes.ts` | Pending | Add DELETE route |
| `backend/src/config/constants.ts` | Pending | Add deletion message constant |
| `frontend/src/types/api.types.ts` | Pending | Add clone fields, Approval type |
| `frontend/src/services/PullRequestService.ts` | Pending | Add delete() method |
| `frontend/src/services/ApiClient.ts` | Pending | Add HTTP delete method if missing |
| `frontend/src/components/MergeRequestsList.tsx` | Pending | Clone badges, delete button |
| `frontend/src/components/MergeRequestsView.tsx` | Pending | Linked MR info, sync status |
| `backend/src/__tests__/services/MRCloneService.test.ts` | Pending | NEW - Unit tests |
| `backend/src/__tests__/services/MRSyncService.test.ts` | Pending | NEW - Unit tests |

---

## Key Decisions Made

_Record important architectural or design decisions here._

1. **None yet** - Implementation not started

---

## Blockers / Issues

_Record any blockers or issues encountered._

1. None yet

---

## Context for Next Session

_Brief summary of what was being worked on and next steps._

**Next Step**: Start Phase 1.1 - Extend PullRequest model with clone tracking fields

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
