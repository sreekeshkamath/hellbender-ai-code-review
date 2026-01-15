import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown } from 'lucide-react';
import { AnalysisResult } from '../types/api.types';

interface ResultCardProps {
  result: AnalysisResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const issues = result.issues || [];
  const vulnerabilities = result.vulnerabilities || [];
  const allIssues = [...issues, ...vulnerabilities];

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-primary/5">
      <CardHeader
        className={`cursor-pointer transition-colors ${expanded ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-10 rounded-full ${result.score !== undefined && result.score > 80 ? 'bg-green-500' : result.score !== undefined && result.score > 50 ? 'bg-yellow-500' : 'bg-red-500'} shrink-0`} />
            <div className="min-w-0">
              <CardTitle className="text-lg font-bold truncate tracking-tight">{result.file.split('/').pop()}</CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono truncate opacity-60 uppercase tracking-widest">{result.file}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {result.score !== undefined && (
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Score</p>
                <p className="text-xl font-black tabular-nums">{result.score}</p>
              </div>
            )}
            {allIssues.length > 0 && (
              <Badge variant="destructive" className="h-6 font-black rounded-md px-2">
                {allIssues.length}
              </Badge>
            )}
            <div className={`p-1 rounded-full transition-transform duration-300 ${expanded ? 'rotate-180 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
          {result.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-destructive text-sm font-medium">Error: {result.error}</p>
            </div>
          )}

          {result.summary && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-border" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</h4>
                <div className="h-[1px] flex-1 bg-border" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">{result.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {result.strengths && result.strengths.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-green-500">
                  <span className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center text-[10px]">✨</span>
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="text-sm flex items-start gap-2 text-muted-foreground group">
                      <div className="w-1 h-1 rounded-full bg-green-500/40 mt-2 shrink-0 group-hover:bg-green-500 transition-colors" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allIssues.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-destructive">
                  <span className="w-5 h-5 rounded bg-destructive/10 flex items-center justify-center text-[10px]">🚨</span>
                  Action Items
                </h4>
                <div className="space-y-4">
                  {[...issues, ...vulnerabilities].map((issue, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors group relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor(issue.severity)}`} />
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-1.5 h-4 leading-none">
                          {issue.type}
                        </Badge>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 rounded-full ${issue.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {issue.severity}
                        </span>
                      </div>
                       <p className="text-sm font-medium mb-3 leading-snug">
                         {'message' in issue ? (issue as any).message : `${issue.type} vulnerability detected`}
                       </p>

                       {issue.code && (
                         <div className="rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                           <div className="bg-zinc-900 px-3 py-1 flex items-center justify-between">
                             <span className="text-[9px] font-mono text-zinc-500 uppercase">Current Implementation</span>
                           </div>
                           <pre className="text-[11px] bg-black text-zinc-300 p-4 overflow-x-auto font-mono leading-relaxed">
                             <code>{issue.code}</code>
                           </pre>
                         </div>
                       )}

                       {'suggestion' in issue && (issue as any).suggestion && (
                         <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                           <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">AI Recommendation</p>
                           <p className="text-xs text-muted-foreground leading-relaxed italic">
                             {(issue as any).suggestion}
                           </p>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
