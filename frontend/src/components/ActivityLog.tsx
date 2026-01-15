
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Activity Log</h3>
        <Button
          onClick={clearLogs}
          variant="outline"
          size="sm"
          disabled={logs.length === 0}
        >
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activity yet
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <Badge variant={getBadgeVariant(log.type)} className="mt-0.5">
                  {log.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}