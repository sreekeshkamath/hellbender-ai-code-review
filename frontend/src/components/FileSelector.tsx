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
      <div className="text-center py-12 opacity-50">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
          <span className="text-lg">📂</span>
        </div>
        <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-tight">No Repository Loaded</p>
        <p className="text-[9px] text-zinc-800 font-mono mt-1">Connect a repo to select files</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Files ({localFiles.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleSelectAll}
            disabled={localFiles.length === 0}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
          >
            All
          </button>
          <button
            onClick={handleSelectNone}
            disabled={selectedFiles.length === 0}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-30"
          >
            None
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto no-scrollbar border border-zinc-900 bg-zinc-950/50 rounded p-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin" />
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tight animate-pulse">Scanning files...</p>
          </div>
        ) : localFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[9px] font-mono text-zinc-800 italic uppercase tracking-tight">No files found in repository</p>
          </div>
        ) : (
          <div className="space-y-1">
            {localFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileToggle(file.path)}
                className={`
                  flex items-center space-x-3 p-2 cursor-pointer transition-all duration-200 group border-l-2
                  ${selectedFiles.includes(file.path)
                    ? 'bg-white text-black border-white'
                    : 'hover:bg-zinc-900 text-zinc-500 border-transparent'}
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={() => handleFileToggle(file.path)}
                  className="w-3 h-3 accent-white"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-mono truncate ${selectedFiles.includes(file.path) ? 'text-black' : 'text-zinc-400'}`}>
                    {file.path}
                  </p>
                  <p className={`text-[9px] font-mono tabular-nums ${selectedFiles.includes(file.path) ? 'text-zinc-800' : 'text-zinc-700'}`}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded border border-white bg-white text-black">
          <span className="text-[9px] font-black uppercase tracking-widest">Selected</span>
          <span className="text-[10px] font-mono font-bold">{selectedFiles.length}</span>
        </div>
      )}
    </div>
  );
}
