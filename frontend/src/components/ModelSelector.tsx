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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          AI Model Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">
            Search Models
          </label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or provider..."
            className="bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCustomOnly(!showCustomOnly)}
            variant={showCustomOnly ? "default" : "outline"}
            size="sm"
            className="h-7 text-[10px] px-2 uppercase tracking-tight"
          >
            Custom Models Only
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground ml-1">
            Select Model
          </label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="bg-background/50 border-muted-foreground/20">
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              {displayedModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">{model.name}</span>
                    <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1 leading-none uppercase tracking-tighter">
                      {model.provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/10 animate-in">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-medium text-primary-foreground/70 truncate">
              Active: {models.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
