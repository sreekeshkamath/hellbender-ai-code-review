export declare class RepositoryMappingService {
    private static DATA_DIR;
    private static MAPPINGS_FILE;
    static createKey(repoUrl: string, branch?: string): string;
    static loadMappings(): Record<string, string>;
    static saveMappings(mappings: Record<string, string>): void;
    static getRepoId(repoUrl: string, branch?: string): string | null;
    static setRepoId(repoUrl: string, branch: string, repoId: string): void;
    static removeMapping(repoUrl: string, branch: string): void;
    static getAllMappings(): Record<string, string>;
    static repoExists(repoId: string, reposDir: string): boolean;
}
