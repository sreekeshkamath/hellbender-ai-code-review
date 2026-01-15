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
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg opacity-50">📂</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No Repository Loaded</p>
              <p className="text-xs text-muted-foreground/60">Connect a repo to select files</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Files ({localFiles.length})
          </CardTitle>
          <div className="flex gap-1">
            <Button
              onClick={handleSelectAll}
              size="sm"
              variant="ghost"
              disabled={localFiles.length === 0}
              className="h-7 text-[10px] px-2 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              All
            </Button>
            <Button
              onClick={handleSelectNone}
              size="sm"
              variant="ghost"
              disabled={selectedFiles.length === 0}
              className="h-7 text-[10px] px-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-72 pr-4 -mr-4 scrollbar-thin">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse">Scanning files...</p>
            </div>
          ) : localFiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-muted-foreground italic opacity-60">No files found in repository</p>
            </div>
          ) : (
            <div className="space-y-1">
              {localFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleFileToggle(file.path)}
                  className={`
                    flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-all duration-200 group
                    ${selectedFiles.includes(file.path)
                      ? 'bg-primary/10 border-primary/20'
                      : 'hover:bg-muted/50 border-transparent'}
                    border
                  `}
                >
                  <Checkbox
                    checked={selectedFiles.includes(file.path)}
                    onCheckedChange={() => handleFileToggle(file.path)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedFiles.includes(file.path) ? 'text-primary' : 'text-foreground'}`}>
                      {file.path}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {selectedFiles.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-md bg-primary/5 border border-primary/10 text-primary animate-in">
            <span className="text-[10px] font-bold uppercase tracking-tight">Selected</span>
            <span className="text-xs font-mono font-bold">{selectedFiles.length}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
