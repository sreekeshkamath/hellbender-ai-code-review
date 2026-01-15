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
      mockedFs.readdirSync.mockImplementation((dir) => {
        if (dir === mockDir) return ['file1.txt', 'subdir', '.git'];
        if (dir === path.join(mockDir, 'subdir')) return ['file2.txt'];
        return [];
      });
      mockedFs.statSync.mockImplementation((filePath) => ({
        isDirectory: () => filePath.includes('subdir'),
      } as any));
      mockedPath.join.mockImplementation((...args) => args.join('/'));

      const result = FileService.getAllFiles(mockDir);

      expect(result).toEqual([
        '/test/dir/file1.txt',
        '/test/dir/subdir/file2.txt',
      ]);
      expect(mockedFs.readdirSync).toHaveBeenCalledTimes(3); // dir, subdir, .git excluded
    });

    it('should exclude .git directory', () => {
      const mockDir = '/test/dir';
      mockedFs.readdirSync.mockReturnValue(['.git', 'file.txt']);
      mockedFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockedPath.join.mockImplementation((...args) => args.join('/'));

      const result = FileService.getAllFiles(mockDir);

      expect(result).toEqual([]);
      expect(mockedFs.readdirSync).toHaveBeenCalledWith(mockDir);
    });
  });
});