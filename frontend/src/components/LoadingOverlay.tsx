import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface LoadingOverlayProps {
  modelName: string;
  isVisible: boolean;
}

export function LoadingOverlay({ modelName, isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-500">
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0 -m-12 border-2 border-primary/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-0 -m-8 border-2 border-primary/20 rounded-full animate-[spin_6s_linear_infinite_reverse]" />

        <Card className="w-96 border-none shadow-2xl shadow-primary/20 bg-card overflow-hidden">
          <CardContent className="p-12 text-center relative">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                <Loader2 className="h-10 w-10 animate-spin text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Neural Analysis in Progress</h3>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px w-8 bg-border" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">System Processing</p>
                  <div className="h-px w-8 bg-border" />
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Harnessing <span className="text-foreground font-bold">{modelName}</span> to perform an deep-level architectural audit and vulnerability scan of your codebase.
              </p>

              <div className="pt-4">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite] w-1/3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
