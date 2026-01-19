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
  // Clone tracking fields
  originalPrId?: string; // Reference to the original PR (for clones)
  clonedPrIds?: string[]; // Array of cloned PR IDs (for originals)
  isCloned: boolean; // Quick check flag
}
