
import { useActivityLog } from '../hooks/useActivityLog';

export function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();

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
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px]">
        {logs.length === 0 ? (
          <span className="text-zinc-800 italic uppercase">Awaiting process signals...</span>
        ) : (
          logs.slice().reverse().map(log => (
            <div key={log.id} className="flex space-x-3 text-zinc-500">
              <span className="text-zinc-800 shrink-0 select-none">[{log.timestamp.toLocaleTimeString()}]</span>
              <span className={`px-1 font-bold uppercase shrink-0 ${
                log.type === 'error' ? 'bg-red-800 text-white' :
                log.type === 'warning' ? 'bg-yellow-500 text-black' :
                log.type === 'success' ? 'bg-white text-black' : 'text-zinc-600'
              }`}>
                {log.type}
              </span>
              <span className="text-zinc-400">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
