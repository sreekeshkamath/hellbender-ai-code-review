import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface LoadingOverlayProps {
  modelName: string;
  isVisible: boolean;
}

export function LoadingOverlay({ modelName, isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-80">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Code</h3>
          <p className="text-sm text-muted-foreground">
            Using {modelName} to review your code...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}