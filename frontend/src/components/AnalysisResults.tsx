import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
      <div className="flex flex-col items-center justify-center py-24 px-6 border-2 border-dashed rounded-3xl bg-card/30 space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl animate-bounce shadow-inner">
          ✨
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-xl font-bold">Ready for Review</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select the files you want to analyze from the sidebar and click
            <span className="mx-1 px-1.5 py-0.5 bg-primary/20 text-primary font-bold rounded">Analyze Code</span>
            to begin your AI-powered code audit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Analysis Results</h2>
          <p className="text-muted-foreground text-sm">
            Insights and recommendations based on {results.length} files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Button
              onClick={() => setViewMode('scroll')}
              variant={viewMode === 'scroll' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-bold"
            >
              Feed View
            </Button>
            <Button
              onClick={() => setViewMode('slide')}
              variant={viewMode === 'slide' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-bold"
            >
              Slide View
            </Button>
          </div>

          <Button
            onClick={clearResults}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 font-bold"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-primary/5 border-primary/10 shadow-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Overall Score</p>
              <p className="text-3xl font-black text-primary">{overallScore}<span className="text-sm font-normal opacity-50 ml-1">/ 100</span></p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-500/5 border-orange-500/10 shadow-none">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500/60">Total Issues</p>
              <p className="text-3xl font-black text-orange-500">{totalIssues}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'scroll' ? (
        <div className="space-y-6">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-2 rounded-xl border shadow-sm">
            <Button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              variant="ghost"
              size="icon"
              className="rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
                File {currentIndex + 1} <span className="mx-2">/</span> {results.length}
              </span>
            </div>

            <Button
              onClick={handleNext}
              disabled={currentIndex === results.length - 1}
              variant="ghost"
              size="icon"
              className="rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
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
