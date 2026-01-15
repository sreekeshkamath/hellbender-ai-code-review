import { useState, useCallback } from 'react';
import { ActivityLogEntry } from '../types/models.types';

const MAX_ENTRIES = 100;

export function useActivityLog() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  const addLog = useCallback((type: ActivityLogEntry['type'], message: string) => {
    const newEntry: ActivityLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
    };

    setLogs(prev => {
      const updated = [newEntry, ...prev];
      return updated.slice(0, MAX_ENTRIES);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
}