import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PullRequest } from '../models/PullRequest';
import { Comment } from '../models/Comment';
import { DATA_DIR } from '../config/constants';

const PULL_REQUESTS_FILE = path.join(DATA_DIR, 'pull-requests.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

// Ensure DATA_DIR exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class PullRequestService {
  private static loadPullRequests(): PullRequest[] {
    try {
      if (!fs.existsSync(PULL_REQUESTS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(PULL_REQUESTS_FILE, 'utf8');
      const prs = JSON.parse(data);
      // Convert date strings back to Date objects
      return prs.map((pr: any) => ({
        ...pr,
        createdAt: new Date(pr.createdAt),
        updatedAt: new Date(pr.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading pull requests:', error);
      return [];
    }
  }

  private static savePullRequests(prs: PullRequest[]): void {
    try {
      fs.writeFileSync(PULL_REQUESTS_FILE, JSON.stringify(prs, null, 2));
    } catch (error) {
      console.error('Error saving pull requests:', error);
      throw error;
    }
  }

  private static loadComments(): Comment[] {
    try {
      if (!fs.existsSync(COMMENTS_FILE)) {
        return [];
      }
      const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
      const comments = JSON.parse(data);
      // Convert date strings back to Date objects
      return comments.map((comment: any) => ({
        ...comment,
        createdAt: new Date(comment.createdAt)
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }

  private static saveComments(comments: Comment[]): void {
    try {
      fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
    } catch (error) {
      console.error('Error saving comments:', error);
      throw error;
    }
  }

  static getAll(repoId?: string): PullRequest[] {
    const prs = this.loadPullRequests();
    if (repoId) {
      return prs.filter(pr => pr.repoId === repoId);
    }
    return prs;
  }

  static getById(id: string): PullRequest | null {
    const prs = this.loadPullRequests();
    return prs.find(pr => pr.id === id) || null;
  }

  static create(data: Partial<PullRequest>): PullRequest {
    const prs = this.loadPullRequests();
    const now = new Date();
    const newPR: PullRequest = {
      id: data.id || uuidv4(),
      repoId: data.repoId || '',
      title: data.title || 'Untitled Pull Request',
      author: data.author || 'unknown',
      status: data.status || 'open',
      createdAt: data.createdAt || now,
      updatedAt: now,
      description: data.description || '',
      sourceBranch: data.sourceBranch || 'main',
      targetBranch: data.targetBranch || 'main',
      filesChanged: data.filesChanged || []
    };
    prs.push(newPR);
    this.savePullRequests(prs);
    return newPR;
  }

  static updateStatus(id: string, status: 'open' | 'merged' | 'closed'): PullRequest | null {
    const prs = this.loadPullRequests();
    const index = prs.findIndex(pr => pr.id === id);
    if (index === -1) {
      return null;
    }
    prs[index].status = status;
    prs[index].updatedAt = new Date();
    this.savePullRequests(prs);
    return prs[index];
  }

  static getComments(prId: string): Comment[] {
    const comments = this.loadComments();
    return comments.filter(comment => comment.prId === prId);
  }

  static addComment(data: Partial<Comment>): Comment {
    const comments = this.loadComments();
    const newComment: Comment = {
      id: data.id || uuidv4(),
      prId: data.prId || '',
      author: data.author || 'unknown',
      content: data.content || '',
      createdAt: data.createdAt || new Date(),
      filePath: data.filePath,
      line: data.line,
      type: data.type || 'user',
      severity: data.severity
    };
    comments.push(newComment);
    this.saveComments(comments);
    return newComment;
  }
}
