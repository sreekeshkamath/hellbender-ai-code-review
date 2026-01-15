
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useActivityLog } from '../hooks/useActivityLog';

export function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'success': return 'default';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Activity Log</h3>
        </div>
        <Button
          onClick={clearLogs}
          variant="ghost"
          size="sm"
          disabled={logs.length === 0}
          className="h-7 text-[10px] font-bold uppercase tracking-widest hover:bg-destructive/10 hover:text-destructive transition-colors px-3"
        >
          Clear Logs
        </Button>
      </div>
      <ScrollArea className="flex-1 px-4 py-2 scrollbar-thin">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 opacity-30">
              <span className="text-2xl">💤</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">System Standby</p>
            </div>
          ) : (
            logs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="group flex items-center gap-4 p-2 rounded-md hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
              >
                <div className="shrink-0 flex flex-col items-center gap-1 w-16">
                  <span className="text-[9px] font-mono text-muted-foreground/50 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <Badge
                    variant={getBadgeVariant(log.type)}
                    className="text-[8px] h-3 px-1 font-black uppercase tracking-tighter leading-none min-w-[40px] justify-center"
                  >
                    {log.type}
                  </Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/80 leading-snug group-hover:text-foreground transition-colors truncate">
                    {log.message}
                  </p>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-1 rounded-full bg-primary" />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
