import * as fs from 'fs';
import * as path from 'path';

export class FileService {
  static getAllFiles(dirPath: string, arrayOfFiles: string[] = [], visitedPaths: Set<string> = new Set()): string[] {
    const realPath = fs.realpathSync(dirPath);
    if (visitedPaths.has(realPath)) {
      return arrayOfFiles; // Skip already-visited directories to prevent symlink cycles
    }
    visitedPaths.add(realPath);

    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      if (file === '.git') return;

      const filePath = path.join(dirPath, file);
      const stats = fs.lstatSync(filePath);

      // Skip symbolic links to avoid infinite recursion
      if (stats.isSymbolicLink()) {
        return;
      }

      if (stats.isDirectory()) {
        this.getAllFiles(filePath, arrayOfFiles, visitedPaths);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }
}