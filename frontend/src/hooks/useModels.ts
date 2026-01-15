import { useState, useEffect, useMemo } from 'react';
import { Model } from '../types/api.types';
import { ReviewService } from '../services/ReviewService';

export function useModels() {
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
        if (fetchedModels.length > 0 && !selectedModel) {
          setSelectedModel(fetchedModels[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const filteredModels = useMemo(() => {
    if (!searchTerm) return models;
    return models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [models, searchTerm]);

  const customModels = useMemo(() => {
    return models.filter(model => model.provider.toLowerCase() === 'custom');
  }, [models]);

  return {
    models: filteredModels,
    allModels: models,
    selectedModel,
    setSelectedModel,
    loading,
    searchTerm,
    setSearchTerm,
    customModels,
  };
}