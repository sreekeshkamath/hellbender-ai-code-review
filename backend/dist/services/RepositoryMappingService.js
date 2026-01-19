"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryMappingService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("../config/constants");
if (!fs.existsSync(constants_1.DATA_DIR)) {
    fs.mkdirSync(constants_1.DATA_DIR, { recursive: true });
}
class RepositoryMappingService {
    static createKey(repoUrl, branch = 'main') {
        const normalizedUrl = repoUrl.toLowerCase().trim().replace(/\.git$/, '');
        return `${normalizedUrl}:${branch}`;
    }
    /**
     * Parses a mapping key back into repoUrl and branch.
     * Handles URLs with colons (e.g., https://, git@host:path) by splitting on the last colon.
     */
    static parseKey(key) {
        const lastColonIndex = key.lastIndexOf(':');
        if (lastColonIndex === -1) {
            return null;
        }
        return {
            repoUrl: key.substring(0, lastColonIndex),
            branch: key.substring(lastColonIndex + 1)
        };
    }
    static loadMappings() {
        try {
            if (!fs.existsSync(constants_1.MAPPINGS_FILE)) {
                return {};
            }
            const data = fs.readFileSync(constants_1.MAPPINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Error loading repo mappings:', error);
            return {};
        }
    }
    static saveMappings(mappings) {
        try {
            fs.writeFileSync(constants_1.MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
        }
        catch (error) {
            console.error('Error saving repo mappings:', error);
        }
    }
    static getRepoId(repoUrl, branch = 'main') {
        const mappings = this.loadMappings();
        const key = this.createKey(repoUrl, branch);
        return mappings[key] || null;
    }
    static setRepoId(repoUrl, branch, repoId) {
        const mappings = this.loadMappings();
        const key = this.createKey(repoUrl, branch);
        mappings[key] = repoId;
        this.saveMappings(mappings);
    }
    static removeMapping(repoUrl, branch) {
        const mappings = this.loadMappings();
        const key = this.createKey(repoUrl, branch);
        delete mappings[key];
        this.saveMappings(mappings);
    }
    static getAllMappings() {
        return this.loadMappings();
    }
    static repoExists(repoId, reposDir) {
        const repoPath = path.join(reposDir, repoId);
        return fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'));
    }
}
exports.RepositoryMappingService = RepositoryMappingService;
