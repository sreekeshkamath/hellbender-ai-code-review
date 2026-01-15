export declare class RepositoryService {
    private static REPOS_DIR;
    private static isValidRepoUrl;
    static clone(repoUrl: string, branch?: string, accessToken?: string): Promise<{
        repoId: string;
        repoPath: string;
        files: {
            path: string;
            size: number;
        }[];
        cached: boolean;
    }>;
    static sync(repoId: string, repoUrl: string, branch?: string, accessToken?: string): Promise<{
        repoId: string;
        repoPath: string;
        files: {
            path: string;
            size: number;
        }[];
    }>;
    static getFiles(repoId: string): {
        path: string;
        size: number;
    }[];
    static readFile(repoId: string, filePath: string): string;
    static delete(repoId: string): void;
}
