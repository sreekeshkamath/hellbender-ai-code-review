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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const FileService_1 = require("../../services/FileService");
jest.mock('fs');
jest.mock('path');
const mockedFs = fs;
const mockedPath = path;
describe('FileService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getAllFiles', () => {
        it('should return all files recursively excluding .git', () => {
            const mockDir = '/test/dir';
            mockedFs.readdirSync.mockImplementation((dir) => {
                if (dir === mockDir)
                    return ['file1.txt', 'subdir', '.git'];
                if (dir === path.join(mockDir, 'subdir'))
                    return ['file2.txt'];
                return [];
            });
            mockedFs.statSync.mockImplementation((filePath) => ({
                isDirectory: () => filePath.includes('subdir'),
            }));
            mockedPath.join.mockImplementation((...args) => args.join('/'));
            const result = FileService_1.FileService.getAllFiles(mockDir);
            expect(result).toEqual([
                '/test/dir/file1.txt',
                '/test/dir/subdir/file2.txt',
            ]);
            expect(mockedFs.readdirSync).toHaveBeenCalledTimes(3); // dir, subdir, .git excluded
        });
        it('should exclude .git directory', () => {
            const mockDir = '/test/dir';
            mockedFs.readdirSync.mockReturnValue(['.git', 'file.txt']);
            mockedFs.statSync.mockReturnValue({ isDirectory: () => true });
            mockedPath.join.mockImplementation((...args) => args.join('/'));
            const result = FileService_1.FileService.getAllFiles(mockDir);
            expect(result).toEqual([]);
            expect(mockedFs.readdirSync).toHaveBeenCalledWith(mockDir);
        });
    });
});
