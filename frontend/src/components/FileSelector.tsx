import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useRepository } from '../hooks/useRepository';

interface FileSelectorProps {
  selectedFiles: string[];
  onSelectionChange: (files: string[]) => void;
}

export function FileSelector({ selectedFiles, onSelectionChange }: FileSelectorProps) {
  const { files, repoId, getFiles, isLoading } = useRepository();
  const [localFiles, setLocalFiles] = useState(files);

  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  useEffect(() => {
    if (repoId) {
      getFiles().then(setLocalFiles).catch(console.error);
    }
  }, [repoId, getFiles]);

  const handleFileToggle = (filePath: string) => {
    const newSelection = selectedFiles.includes(filePath)
      ? selectedFiles.filter(f => f !== filePath)
      : [...selectedFiles, filePath];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(localFiles.map(f => f.path));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  if (!repoId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Load a repository first
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Files ({localFiles.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleSelectAll}
              size="sm"
              variant="outline"
              disabled={localFiles.length === 0}
            >
              Select All
            </Button>
            <Button
              onClick={handleSelectNone}
              size="sm"
              variant="outline"
              disabled={selectedFiles.length === 0}
            >
              Select None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : localFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files found
            </div>
          ) : (
            <div className="space-y-2">
              {localFiles.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center space-x-3 p-2 rounded hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedFiles.includes(file.path)}
                    onCheckedChange={() => handleFileToggle(file.path)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.path}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {selectedFiles.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </CardContent>
    </Card>
  );
}