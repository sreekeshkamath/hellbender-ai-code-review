import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Model } from '../types/api.types';
import { ReviewService } from '../services/ReviewService';

interface ModelsContextValue {
  models: Model[];
  allModels: Model[];
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  customModels: Model[];
  freeModelId: string | null;
}

const ModelsContext = createContext<ModelsContextValue | null>(null);

const FREE_MODEL_FALLBACK_ID = 'openai/gpt-4o-mini';

const isFreeModel = (model: Model) => {
  const normalizedName = model.name.toLowerCase();
  const normalizedProvider = model.provider.toLowerCase();
  return normalizedName.includes('free') || normalizedProvider.includes('free') || model.id.toLowerCase().includes(':free');
};

const resolveFreeModelId = (models: Model[]) => {
  if (models.length === 0) return null;
  const explicitFree = models.find(isFreeModel);
  if (explicitFree) return explicitFree.id;
  const fallback = models.find(model => model.id === FREE_MODEL_FALLBACK_ID);
  return fallback ? fallback.id : models[0].id;
};

const orderWithFreeFirst = (models: Model[], freeModelId: string | null) => {
  if (!freeModelId) return models;
  const freeModel = models.find(model => model.id === freeModelId);
  const rest = models.filter(model => model.id !== freeModelId);
  return freeModel ? [freeModel, ...rest] : models;
};

export function ModelsProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const reviewService = new ReviewService();
        const fetchedModels = await reviewService.getModels();
        setModels(fetchedModels);

        const freeModelId = resolveFreeModelId(fetchedModels);
        if (freeModelId && !selectedModel) {
          setSelectedModel(freeModelId);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const freeModelId = useMemo(() => resolveFreeModelId(models), [models]);

  const filteredModels = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    // Check if the search term looks like a specific model ID (e.g. "provider/model")
    // and if it's not already in the fetched models list
    const isModelIdPattern = normalizedSearch.includes('/') && normalizedSearch.length > 3;
    const exactModelMatch = models.find(m => m.id.toLowerCase() === normalizedSearch);
    
    let baseList = normalizedSearch
      ? models.filter(model =>
          model.name.toLowerCase().includes(normalizedSearch) ||
          model.provider.toLowerCase().includes(normalizedSearch) ||
          model.id.toLowerCase().includes(normalizedSearch)
        )
      : models;

    // If it's a model ID pattern and not in our list, add it as a virtual option
    if (isModelIdPattern && !exactModelMatch) {
      const [provider] = searchTerm.split('/');
      const virtualModel: Model = {
        id: searchTerm.trim(),
        name: searchTerm.trim(),
        provider: provider.charAt(0).toUpperCase() + provider.slice(1)
      };
      baseList = [virtualModel, ...baseList];
    }

    const ordered = orderWithFreeFirst(baseList, freeModelId);

    if (!freeModelId) {
      return ordered;
    }

    const hasFree = ordered.some(model => model.id === freeModelId);
    if (hasFree) {
      return ordered;
    }

    const freeModel = models.find(model => model.id === freeModelId);
    return freeModel ? [freeModel, ...ordered] : ordered;
  }, [models, searchTerm, freeModelId]);

  const customModels = useMemo(() => {
    return models.filter(model => model.provider.toLowerCase() === 'custom');
  }, [models]);

  const value = useMemo<ModelsContextValue>(() => ({
    models: filteredModels,
    allModels: models,
    selectedModel,
    setSelectedModel,
    loading,
    searchTerm,
    setSearchTerm,
    customModels,
    freeModelId,
  }), [filteredModels, models, selectedModel, loading, searchTerm, customModels, freeModelId]);

  return React.createElement(ModelsContext.Provider, { value }, children);
}

export function useModels() {
  const context = useContext(ModelsContext);
  if (!context) {
    throw new Error('useModels must be used within a ModelsProvider');
  }
  return context;
}