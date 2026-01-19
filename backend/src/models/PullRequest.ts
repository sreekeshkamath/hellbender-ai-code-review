export interface PullRequest {
  id: string;
  repoId: string;
  title: string;
  author: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  filesChanged: string[];
}
