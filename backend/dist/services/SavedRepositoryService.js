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
exports.SavedRepositoryService = void 0;
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const EncryptionService_1 = require("./EncryptionService");
const constants_1 = require("../config/constants");
if (!fs.existsSync(constants_1.DATA_DIR)) {
    fs.mkdirSync(constants_1.DATA_DIR, { recursive: true });
}
class SavedRepositoryService {
    static loadRepos() {
        try {
            if (!fs.existsSync(constants_1.REPOS_FILE)) {
                return [];
            }
            const encrypted = fs.readFileSync(constants_1.REPOS_FILE, 'utf8');
            const decrypted = EncryptionService_1.EncryptionService.decrypt(encrypted);
            if (!decrypted)
                return [];
            return JSON.parse(decrypted);
        }
        catch (error) {
            console.error('Error loading repos:', error);
            return [];
        }
    }
    static saveRepos(repos) {
        try {
            const encrypted = EncryptionService_1.EncryptionService.encrypt(JSON.stringify(repos));
            fs.writeFileSync(constants_1.REPOS_FILE, encrypted);
        }
        catch (error) {
            console.error('Error saving repos:', error);
        }
    }
    static getAll() {
        return this.loadRepos();
    }
    static add(repo) {
        const repos = this.loadRepos();
        const newRepo = {
            id: (0, uuid_1.v4)(),
            name: repo.name || repo.url.split('/').pop()?.replace(/\.git$/, '') || 'Unnamed',
            url: repo.url,
            branch: repo.branch || 'main',
            repoId: repo.repoId || null,
            cloned: repo.cloned || false,
            createdAt: new Date().toISOString(),
            lastUsed: null
        };
        repos.push(newRepo);
        this.saveRepos(repos);
        return newRepo;
    }
    static delete(id) {
        const repos = this.loadRepos();
        const filtered = repos.filter(r => r.id !== id);
        this.saveRepos(filtered);
    }
    static update(id, updates) {
        const repos = this.loadRepos();
        const index = repos.findIndex(r => r.id === id);
        if (index !== -1) {
            repos[index] = { ...repos[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveRepos(repos);
            return repos[index];
        }
        return null;
    }
    static touch(id) {
        const repos = this.loadRepos();
        const index = repos.findIndex(r => r.id === id);
        if (index !== -1) {
            repos[index].lastUsed = new Date().toISOString();
            this.saveRepos(repos);
        }
    }
}
exports.SavedRepositoryService = SavedRepositoryService;
