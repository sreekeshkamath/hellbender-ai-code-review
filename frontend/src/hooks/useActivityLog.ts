import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ActivityLogEntry } from '../types/models.types';

const MAX_ENTRIES = 100;

interface ActivityLogContextValue {
  logs: ActivityLogEntry[];
  addLog: (type: ActivityLogEntry['type'], message: string) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextValue | null>(null);

export function ActivityLogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  const addLog = useCallback((type: ActivityLogEntry['type'], message: string) => {
    const newEntry: ActivityLogEntry = {
      id: `${Date.now()}-${Math.random()}`, // More unique ID
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

  const value = useMemo<ActivityLogContextValue>(() => ({
    logs,
    addLog,
    clearLogs,
  }), [logs, addLog, clearLogs]);

  return React.createElement(ActivityLogContext.Provider, { value }, children);
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}