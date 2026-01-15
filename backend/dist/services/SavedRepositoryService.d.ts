import { SavedRepository } from '../models/SavedRepository';
export declare class SavedRepositoryService {
    private static DATA_DIR;
    private static REPOS_FILE;
    static loadRepos(): any[];
    static saveRepos(repos: any[]): void;
    static getAll(): SavedRepository[];
    static add(repo: {
        name?: string;
        url: string;
        branch?: string;
        repoId?: string;
        cloned?: boolean;
    }): SavedRepository;
    static delete(id: string): void;
    static update(id: string, updates: Partial<SavedRepository & {
        updatedAt?: string;
    }>): SavedRepository | null;
    static touch(id: string): void;
}
