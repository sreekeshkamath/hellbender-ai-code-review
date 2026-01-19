import { PullRequest } from '../models/PullRequest';
import { Comment } from '../models/Comment';
import { PullRequestService } from './PullRequestService';
import { MRCloneService } from './MRCloneService';

export class MRSyncService {
  /**
   * Syncs status changes bidirectionally:
   * - Original -> Clones: When original status changes, propagate to all clones
   * - Clone -> Original -> Other Clones: When clone status changes, update original, then propagate to siblings
   */
  static async syncStatus(prId: string, newStatus: 'open' | 'merged' | 'closed', skipSync = false): Promise<void> {
    if (skipSync) {
      return; // Prevent infinite recursion
    }

    const pr = PullRequestService.getById(prId);
    if (!pr) {
      return;
    }

    if (pr.originalPrId) {
      // This is a clone - update original first, then sync to siblings
      const original = PullRequestService.getById(pr.originalPrId);
      if (original) {
        // Update original status
        PullRequestService.updateStatus(pr.originalPrId, newStatus, true); // skipSync = true

        // Propagate to all other clones (siblings)
        if (original.clonedPrIds) {
          for (const cloneId of original.clonedPrIds) {
            if (cloneId !== prId) {
              // Update sibling clone status
              PullRequestService.updateStatus(cloneId, newStatus, true); // skipSync = true
            }
          }
        }
      }
    } else {
      // This is an original - propagate to all clones
      if (pr.clonedPrIds && pr.clonedPrIds.length > 0) {
        for (const cloneId of pr.clonedPrIds) {
          PullRequestService.updateStatus(cloneId, newStatus, true); // skipSync = true
        }
      }
    }
  }

  /**
   * Syncs comments bidirectionally:
   * - Original -> Clones: New comment on original creates copies on all clones
   * - Clone -> Original: New comment on clone creates copy on original (with originalCommentId)
   */
  static async syncComments(prId: string, comment: Comment, skipSync = false): Promise<void> {
    if (skipSync) {
      return; // Prevent infinite recursion
    }

    const pr = PullRequestService.getById(prId);
    if (!pr) {
      return;
    }

    if (pr.originalPrId) {
      // This is a clone - create comment on original
      PullRequestService.addComment({
        prId: pr.originalPrId,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt,
        filePath: comment.filePath,
        line: comment.line,
        type: comment.type,
        severity: comment.severity,
        originalCommentId: comment.id
      });
    } else {
      // This is an original - create comments on all clones
      if (pr.clonedPrIds && pr.clonedPrIds.length > 0) {
        for (const cloneId of pr.clonedPrIds) {
          PullRequestService.addComment({
            prId: cloneId,
            author: comment.author,
            content: comment.content,
            createdAt: comment.createdAt,
            filePath: comment.filePath,
            line: comment.line,
            type: comment.type,
            severity: comment.severity,
            originalCommentId: comment.id
          });
        }
      }
    }
  }

  /**
   * Syncs approvals bidirectionally (similar to comments)
   */
  static async syncApprovals(prId: string, approvalId: string, skipSync = false): Promise<void> {
    if (skipSync) {
      return; // Prevent infinite recursion
    }

    // TODO: Implement approval sync when ApprovalService is created
    // For now, this is a placeholder
    console.log(`Approval sync requested for PR ${prId}, approval ${approvalId}`);
  }

  /**
   * Gets sync status for a PR
   */
  static getSyncStatus(prId: string): { inSync: boolean; lastSynced?: Date } {
    const pr = PullRequestService.getById(prId);
    if (!pr) {
      return { inSync: false };
    }

    // For now, assume in sync if PR exists
    // Future: Could check if status/comments match between original and clones
    return {
      inSync: true,
      lastSynced: pr.updatedAt
    };
  }
}
