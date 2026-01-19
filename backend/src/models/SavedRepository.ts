export interface SavedRepository {
  id: string;
  name: string;
  url: string;
  branch: string;
  repoId: string | null;
  cloned: boolean;
  createdAt: string;
  lastUsed: string | null;
  updatedAt?: string;
}