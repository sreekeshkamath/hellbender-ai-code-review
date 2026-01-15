export declare const DEFAULT_PORT = 3001;
export declare const APP_NAME = "AI Code Reviewer";
export declare const DATA_DIR: string;
export declare const REPOS_FILE: string;
export declare const MAPPINGS_FILE: string;
export declare const ENCRYPTION_KEY_DEFAULT = "default-key-change-in-production-32!";
export declare const IV_LENGTH = 16;
export declare const ALGORITHM = "aes-256-cbc";
export declare const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export declare const OPENROUTER_DEFAULT_TITLE = "AI Code Reviewer";
export declare const OPENROUTER_MAX_TOKENS = 4000;
export declare const OPENROUTER_TEMPERATURE = 0.3;
export declare const VULNERABILITY_PATTERNS: ({
    pattern: RegExp;
    severity: "high";
    type: string;
} | {
    pattern: RegExp;
    severity: "medium";
    type: string;
} | {
    pattern: RegExp;
    severity: "low";
    type: string;
})[];
