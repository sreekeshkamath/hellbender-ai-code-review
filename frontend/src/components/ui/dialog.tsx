import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'bg-zinc-950 border border-zinc-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0 text-zinc-600 hover:text-white"
          >
            <X size={16} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
