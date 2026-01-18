import * as fs from 'fs';
import * as path from 'path';
import { FileService } from '../../services/FileService';

jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('FileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllFiles', () => {
    it('should return all files recursively excluding .git', () => {
      const mockDir = '/test/dir';
      const subdirPath = '/test/dir/subdir';
      mockedPath.join.mockImplementation((...args) => args.join('/'));
      (mockedFs.readdirSync as jest.Mock).mockImplementation((dir: string) => {
        if (dir === mockDir) return ['file1.txt', 'subdir', '.git'];
        if (dir === subdirPath) return ['file2.txt'];
        return [];
      });
      mockedFs.statSync.mockImplementation((filePath) => ({
        isDirectory: () => filePath === subdirPath,
      } as any));

      const result = FileService.getAllFiles(mockDir);

      expect(result).toEqual([
        '/test/dir/file1.txt',
        '/test/dir/subdir/file2.txt',
      ]);
      expect(mockedFs.readdirSync).toHaveBeenCalledTimes(2); // dir, subdir (git is excluded before recursing)
    });

    it('should exclude .git directory', () => {
      const mockDir = '/test/dir';
      const gitPath = '/test/dir/.git';
      mockedPath.join.mockImplementation((...args) => args.join('/'));
      (mockedFs.readdirSync as jest.Mock).mockImplementation((dir: string) => {
        if (dir === mockDir) return ['.git', 'file.txt'];
        // Return empty array for any other directory to prevent infinite recursion
        return [];
      });
      mockedFs.statSync.mockImplementation((filePath) => ({
        isDirectory: () => filePath === gitPath,
      } as any));

      const result = FileService.getAllFiles(mockDir);

      // .git is excluded, but file.txt should be included
      expect(result).toEqual(['/test/dir/file.txt']);
      expect(mockedFs.readdirSync).toHaveBeenCalledWith(mockDir);
    });
  });
});