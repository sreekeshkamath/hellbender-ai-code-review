import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PullRequest } from '../models/PullRequest';
import { Comment } from '../models/Comment';
import { Approval } from '../models/Approval';
import { PullRequestService } from './PullRequestService';
import { DATA_DIR } from '../config/constants';

const APPROVALS_FILE = path.join(DATA_DIR, 'approvals.json');

// Ensure DATA_DIR exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class MRCloneService {
  /**
   * Clones all merge requests from source repository to target repository
   */
  static async cloneMergeRequests(sourceRepoId: string, targetRepoId: string): Promise<PullRequest[]> {
    const sourcePRs = PullRequestService.getAll(sourceRepoId);
    const clonedPRs: PullRequest[] = [];

    for (const sourcePR of sourcePRs) {
      const clonedPR = await this.cloneSingleMR(sourcePR.id, targetRepoId);
      clonedPRs.push(clonedPR);
    }

    return clonedPRs;
  }

  /**
   * Clones a single merge request to a target repository
   */
  static async cloneSingleMR(prId: string, targetRepoId: string): Promise<PullRequest> {
    const sourcePR = PullRequestService.getById(prId);
    if (!sourcePR) {
      throw new Error(`Pull Request with id ${prId} not found`);
    }

    // Create cloned PR with new ID
    const clonedPR = PullRequestService.create({
      repoId: targetRepoId,
      title: sourcePR.title,
      author: sourcePR.author,
      status: sourcePR.status,
      createdAt: sourcePR.createdAt,
      updatedAt: sourcePR.updatedAt,
      description: sourcePR.description,
      sourceBranch: sourcePR.sourceBranch,
      targetBranch: sourcePR.targetBranch,
      filesChanged: [...sourcePR.filesChanged],
      originalPrId: sourcePR.id,
      clonedPrIds: [],
      isCloned: true
    });

    // Update source PR to track this clone
    this.addCloneToOriginal(sourcePR.id, clonedPR.id);

    // Clone associated comments
    await this.cloneComments(sourcePR.id, clonedPR.id);

    // Clone associated approvals
    await this.cloneApprovals(sourcePR.id, clonedPR.id);

    return clonedPR;
  }

  /**
   * Adds a clone ID to the original PR's clonedPrIds array
   */
  private static addCloneToOriginal(originalPrId: string, clonedPrId: string): void {
    const prs = this.loadPullRequests();
    const index = prs.findIndex(pr => pr.id === originalPrId);
    if (index !== -1) {
      if (!prs[index].clonedPrIds) {
        prs[index].clonedPrIds = [];
      }
      if (!prs[index].clonedPrIds.includes(clonedPrId)) {
        prs[index].clonedPrIds.push(clonedPrId);
      }
      prs[index].updatedAt = new Date();
      this.savePullRequests(prs);
    }
  }

  /**
   * Clones all comments from source PR to target PR
   */
  static async cloneComments(sourcePrId: string, targetPrId: string): Promise<Comment[]> {
    const sourceComments = PullRequestService.getComments(sourcePrId);
    const clonedComments: Comment[] = [];

    for (const sourceComment of sourceComments) {
      const clonedComment = PullRequestService.addComment({
        prId: targetPrId,
        author: sourceComment.author,
        content: sourceComment.content,
        createdAt: sourceComment.createdAt,
        filePath: sourceComment.filePath,
        line: sourceComment.line,
        type: sourceComment.type,
        severity: sourceComment.severity,
        originalCommentId: sourceComment.id
      });
      clonedComments.push(clonedComment);
    }

    return clonedComments;
  }

  /**
   * Clones all approvals from source PR to target PR
   */
  static async cloneApprovals(sourcePrId: string, targetPrId: string): Promise<Approval[]> {
    const sourceApprovals = this.getApprovalsByPrId(sourcePrId);
    const clonedApprovals: Approval[] = [];

    for (const sourceApproval of sourceApprovals) {
      const clonedApproval = this.createApproval({
        prId: targetPrId,
        approver: sourceApproval.approver,
        status: sourceApproval.status,
        createdAt: sourceApproval.createdAt,
        updatedAt: sourceApproval.updatedAt,
        originalApprovalId: sourceApproval.id
      });
      clonedApprovals.push(clonedApproval);
    }

    return clonedApprovals;
  }

  /**
   * Gets linked MRs (original and clones) for a given PR ID
   */
  static getLinkedMRs(prId: string): { original?: PullRequest; clones: PullRequest[] } {
    const pr = PullRequestService.getById(prId);
    if (!pr) {
      return { clones: [] };
    }

    let original: PullRequest | undefined;
    const clones: PullRequest[] = [];

    if (pr.originalPrId) {
      // This is a clone, find the original
      original = PullRequestService.getById(pr.originalPrId) || undefined;
    } else {
      // This is an original, find all clones
      original = pr;
      if (pr.clonedPrIds && pr.clonedPrIds.length > 0) {
        for (const cloneId of pr.clonedPrIds) {
          const clone = PullRequestService.getById(cloneId);
          if (clone) {
            clones.push(clone);
          }
        }
      }
    }

    return { original, clones };
  }

  /**
   * Checks if a PR is a cloned MR
   */
  static isClonedMR(prId: string): boolean {
    const pr = PullRequestService.getById(prId);
    return pr ? (pr.isCloned || !!pr.originalPrId) : false;
  }

  /**
   * Helper methods for approvals
   */
  private static loadApprovals(): Approval[] {
    try {
      if (!fs.existsSync(APPROVALS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(APPROVALS_FILE, 'utf8');
      const approvals = JSON.parse(data);
      return approvals.map((approval: any) => ({
        ...approval,
        createdAt: new Date(approval.createdAt),
        updatedAt: new Date(approval.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading approvals:', error);
      return [];
    }
  }

  private static saveApprovals(approvals: Approval[]): void {
    try {
      fs.writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
    } catch (error) {
      console.error('Error saving approvals:', error);
      throw error;
    }
  }

  private static getApprovalsByPrId(prId: string): Approval[] {
    const approvals = this.loadApprovals();
    return approvals.filter(approval => approval.prId === prId);
  }

  private static createApproval(data: Partial<Approval>): Approval {
    const approvals = this.loadApprovals();
    const now = new Date();
    const newApproval: Approval = {
      id: data.id || uuidv4(),
      prId: data.prId || '',
      originalApprovalId: data.originalApprovalId,
      approver: data.approver || 'unknown',
      status: data.status || 'pending',
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
    approvals.push(newApproval);
    this.saveApprovals(approvals);
    return newApproval;
  }

  /**
   * Helper methods for pull requests (duplicated from PullRequestService for internal use)
   */
  private static loadPullRequests(): PullRequest[] {
    try {
      const pullRequestsFile = path.join(DATA_DIR, 'pull-requests.json');
      if (!fs.existsSync(pullRequestsFile)) {
        return [];
      }
      const data = fs.readFileSync(pullRequestsFile, 'utf8');
      const prs = JSON.parse(data);
      return prs.map((pr: any) => ({
        ...pr,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt),
        clonedPrIds: pr.clonedPrIds || [],
        isCloned: pr.isCloned ?? false
      }));
    } catch (error) {
      console.error('Error loading pull requests:', error);
      return [];
    }
  }

  private static savePullRequests(prs: PullRequest[]): void {
    try {
      const pullRequestsFile = path.join(DATA_DIR, 'pull-requests.json');
      fs.writeFileSync(pullRequestsFile, JSON.stringify(prs, null, 2));
    } catch (error) {
      console.error('Error saving pull requests:', error);
      throw error;
    }
  }
}
