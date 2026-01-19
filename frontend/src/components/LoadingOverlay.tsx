import { RefreshCw, Code, Terminal, Bug, Cpu, Layers } from 'lucide-react';

interface LoadingOverlayProps {
  modelName: string;
  isVisible: boolean;
}

export function LoadingOverlay({ modelName, isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
      <div className="relative w-full max-w-xl p-12">
        {/* Decorative Grid Backdrop */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-1 opacity-5 pointer-events-none">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>

        <div className="relative space-y-12">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
               <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black italic text-2xl select-none">H</div>
               <div className="h-6 w-px bg-zinc-800"></div>
               <h3 className="text-2xl font-black uppercase tracking-[0.2em] italic">Hellbender Audit</h3>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-white via-zinc-800 to-transparent"></div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Neural Engine</p>
                <p className="text-lg font-mono text-white">{modelName}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Status</p>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                  <p className="text-[11px] font-mono uppercase tracking-widest text-white">Analysis in Progress</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-8 p-8 border border-zinc-900 bg-zinc-950/50">
               <div className="relative">
                 <div className="absolute inset-0 border border-white/20 scale-150 rotate-45 animate-[spin_10s_linear_infinite]"></div>
                 <div className="absolute inset-0 border border-white/10 scale-125 -rotate-12 animate-[spin_15s_linear_infinite_reverse]"></div>
                 <RefreshCw className="w-16 h-16 text-white animate-spin-slow opacity-20" />
                 <Cpu className="absolute inset-0 m-auto w-8 h-8 text-white" />
               </div>
               
               <div className="w-full space-y-2">
                 <div className="h-0.5 w-full bg-zinc-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white w-1/3 animate-[loading-bar_1.5s_infinite]"></div>
                 </div>
                 <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                    <span>Byte Scan</span>
                    <span>100% Load</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Footer Warning/Info */}
          <div className="border border-zinc-900 p-4 bg-zinc-950/20">
             <div className="flex items-start space-x-3">
               <Bug className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
               <p className="text-[9px] font-mono leading-relaxed text-zinc-500 uppercase tracking-tight">
                 CAUTION: Deep neural analysis is computationally intensive. Hellbender is currently auditing selected source files for architectural integrity and potential security exploits.
               </p>
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
