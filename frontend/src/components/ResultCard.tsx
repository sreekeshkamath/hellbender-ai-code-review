import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{result.file}</CardTitle>
          <div className="flex items-center gap-2">
            {result.score !== undefined && (
              <Badge variant="outline">
                Score: {result.score}/100
              </Badge>
            )}
            {allIssues.length > 0 && (
              <Badge variant="destructive">
                {allIssues.length} issue{allIssues.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {result.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 text-sm">Error: {result.error}</p>
            </div>
          )}

          {result.summary && (
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </div>
          )}

          {result.strengths && result.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Strengths</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {result.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {issues.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Issues</h4>
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(issue.severity)}`}
                      />
                      <Badge variant="outline">{issue.type}</Badge>
                      <Badge variant="secondary">{issue.severity}</Badge>
                    </div>
                    <p className="text-sm mb-2">{issue.message}</p>
                    {issue.code && (
                      <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-x-auto">
                        <code>{issue.code}</code>
                      </pre>
                    )}
                    {issue.suggestion && (
                      <div className="mt-2">
                        <p className="text-xs font-medium">Suggestion:</p>
                        <p className="text-xs text-muted-foreground">
                          {issue.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vulnerabilities.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Vulnerabilities</h4>
              <div className="space-y-3">
                {vulnerabilities.map((vuln, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getSeverityColor(vuln.severity)}`}
                      />
                      <Badge variant="outline">{vuln.type}</Badge>
                      <Badge variant="secondary">{vuln.severity}</Badge>
                    </div>
                    {vuln.code && (
                      <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-x-auto">
                        <code>{vuln.code}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}