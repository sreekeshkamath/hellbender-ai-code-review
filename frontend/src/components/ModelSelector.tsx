import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useModels } from '../hooks/useModels';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const { models, loading, searchTerm, setSearchTerm } = useModels();
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  const displayedModels = showCustomOnly
    ? models.filter(model => model.provider.toLowerCase() === 'custom')
    : models;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading models...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Search Models</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or provider..."
            className="w-full bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all text-zinc-200 placeholder:text-zinc-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomOnly(!showCustomOnly)}
            className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-colors ${
              showCustomOnly
                ? 'bg-zinc-100 text-black border-white'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            Custom Models Only
          </button>
        </div>

        <div>
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Select Model</label>
          <select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-zinc-500 transition-all text-zinc-200"
          >
            <option value="" className="bg-zinc-950">Choose a model...</option>
            {displayedModels.map((model) => (
              <option key={model.id} value={model.id} className="bg-zinc-950">
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedModel && (
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-white bg-white text-black">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <span className="text-[10px] font-mono truncate">
            Active: {models.find(m => m.id === selectedModel)?.name}
          </span>
        </div>
      )}
    </div>
  );
}
