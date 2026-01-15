import * as fs from 'fs';
import * as path from 'path';

export class FileService {
  static getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      if (file === '.git') return;

      const filePath = path.join(dirPath, file);

      if (fs.statSync(filePath).isDirectory()) {
        FileService.getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }
}