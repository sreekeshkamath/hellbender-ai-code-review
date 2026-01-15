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
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analysis results yet. Select files and run analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Overall Score: {overallScore}/100</Badge>
                <Badge variant="secondary">{totalIssues} issues</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('scroll')}
                  variant={viewMode === 'scroll' ? 'default' : 'outline'}
                  size="sm"
                >
                  Scroll
                </Button>
                <Button
                  onClick={() => setViewMode('slide')}
                  variant={viewMode === 'slide' ? 'default' : 'outline'}
                  size="sm"
                >
                  Slide
                </Button>
                <Button
                  onClick={clearResults}
                  variant="destructive"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {viewMode === 'scroll' ? (
        <div className="space-y-4">
          {results.map((result, index) => (
            <ResultCard key={index} result={result} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {results.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={currentIndex === results.length - 1}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {results[currentIndex] && (
              <ResultCard result={results[currentIndex]} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}