import { FileInfo } from './FileInfo';

export interface Repository {
  repoId: string;
  repoPath: string;
  files: FileInfo[];
  cached: boolean;
}