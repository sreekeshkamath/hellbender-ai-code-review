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
exports.SITE_URL = exports.OPENROUTER_API_KEY = exports.GITHUB_ACCESS_TOKEN = exports.ALGORITHM = exports.IV_LENGTH = exports.ENCRYPTION_KEY = exports.MAPPINGS_FILE = exports.REPOS_FILE = exports.DATA_DIR = exports.REPOS_DIR = void 0;
const path = __importStar(require("path"));
exports.REPOS_DIR = path.join(__dirname, '../../../temp/repos');
exports.DATA_DIR = path.join(__dirname, '../../../data');
exports.REPOS_FILE = path.join(exports.DATA_DIR, 'repos.json.enc');
exports.MAPPINGS_FILE = path.join(exports.DATA_DIR, 'repo-mappings.json');
exports.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32!';
exports.IV_LENGTH = 16;
exports.ALGORITHM = 'aes-256-cbc';
exports.GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
exports.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
exports.SITE_URL = process.env.SITE_URL || 'http://localhost:3001';
