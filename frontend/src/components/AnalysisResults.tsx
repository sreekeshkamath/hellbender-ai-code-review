import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResultCard } from './ResultCard';
import { useAnalysis } from '../hooks/useAnalysis';

type ViewMode = 'scroll' | 'slide';

export function AnalysisResults() {
  const { results, clearResults } = useAnalysis();
  const [viewMode, setViewMode] = useState<ViewMode>('scroll');
  const [currentIndex, setCurrentIndex] = useState(0);

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
    : 0;

  const totalIssues = results.reduce((sum, r) =>
    sum + ((r.issues?.length || 0) + (r.vulnerabilities?.length || 0)), 0
  );

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(results.length - 1, prev + 1));
  };

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 space-y-6">
        <div className="w-20 h-20 border border-zinc-800 rounded-full flex items-center justify-center text-4xl">
          ✨
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-[14px] font-black uppercase tracking-tight text-zinc-400">Ready for Review</h3>
          <p className="text-[11px] text-zinc-600 leading-relaxed font-mono">
            Select files from the sidebar and click AUDIT to begin neural analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight uppercase text-zinc-300">Analysis Results</h2>
          <p className="text-zinc-600 text-[11px] font-mono">
            Insights from {results.length} files processed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded border border-zinc-800">
            <button
              onClick={() => setViewMode('scroll')}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
                viewMode === 'scroll'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Feed View
            </button>
            <button
              onClick={() => setViewMode('slide')}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors ${
                viewMode === 'slide'
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Slide View
            </button>
          </div>

          <button
            onClick={clearResults}
            className="px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-red-600 hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 border border-zinc-800 bg-zinc-950 flex items-center gap-4">
          <div className="w-12 h-12 bg-white text-black rounded flex items-center justify-center text-xl font-black">
            🎯
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Overall Score</p>
            <p className="text-3xl font-black text-white tabular-nums">{overallScore}<span className="text-sm font-normal text-zinc-600 ml-1">/ 100</span></p>
          </div>
        </div>

        <div className="p-6 border border-zinc-800 bg-zinc-950 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-900 text-red-400 rounded flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Total Issues</p>
            <p className="text-3xl font-black text-red-400 tabular-nums">{totalIssues}</p>
          </div>
        </div>
      </div>

      {viewMode === 'scroll' ? (
        <div className="space-y-6">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded border border-zinc-800 text-zinc-600 hover:text-white hover:border-white transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">
                File {currentIndex + 1} / {results.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === results.length - 1}
              className="p-2 rounded border border-zinc-800 text-zinc-600 hover:text-white hover:border-white transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-[400px]">
            {results[currentIndex] && (
              <ResultCard result={results[currentIndex]} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
