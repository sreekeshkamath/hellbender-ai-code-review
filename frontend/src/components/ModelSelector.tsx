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
    <Card>
      <CardHeader>
        <CardTitle>AI Model Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Search Models
          </label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or provider..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCustomOnly(!showCustomOnly)}
            variant={showCustomOnly ? "default" : "outline"}
            size="sm"
          >
            Custom Models
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Model
          </label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              {displayedModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {model.provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModel && (
          <div className="text-sm text-muted-foreground">
            Selected: {models.find(m => m.id === selectedModel)?.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}