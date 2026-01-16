import { useEffect, useRef } from 'react';
import { useActivityLog } from '../hooks/useActivityLog';

export function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full bg-black flex flex-col">
      <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center space-x-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>System Console</span>
        </div>
        <button
          onClick={clearLogs}
          disabled={logs.length === 0}
          className="text-zinc-700 hover:text-white transition-colors disabled:opacity-30"
        >
          <span className="text-[9px] font-mono">CLEAR</span>
        </button>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[10px] scroll-smooth"
      >
        {logs.length === 0 ? (
          <span className="text-zinc-800 italic uppercase">Awaiting process signals...</span>
        ) : (
          logs.map(log => {
            const isError = log.type === 'error';
            const isSuccess = log.type === 'success';
            const isSeparator = log.message.startsWith('═') || log.message.startsWith('─');
            
            return (
              <div 
                key={log.id} 
                className={`flex space-x-3 ${
                  isError ? 'text-red-400' : 
                  isSuccess ? 'text-green-400' : 
                  isSeparator ? 'text-zinc-700' :
                  'text-zinc-500'
                }`}
              >
                <span className="text-zinc-800 shrink-0 select-none">[{log.timestamp.toLocaleTimeString()}]</span>
                <span className={`px-1 font-bold uppercase shrink-0 ${
                  log.type === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                  log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' :
                  log.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' : 
                  'text-zinc-600'
                }`}>
                  {log.type}
                </span>
                <span className={`flex-1 break-words ${
                  isError ? 'text-red-300' : 
                  isSuccess ? 'text-green-300' : 
                  'text-zinc-400'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
