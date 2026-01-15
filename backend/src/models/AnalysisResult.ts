import { Vulnerability } from './Vulnerability';

export interface Issue {
  line: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code: string;
  suggestion: string;
}

export interface AnalysisSummary {
  overallScore: number;
  totalFiles: number;
  vulnerabilityCount: number;
  reviewedAt: string;
}

export interface FileAnalysis {
  file: string;
  score?: number;
  issues: Issue[];
  strengths: string[];
  summary: string;
  vulnerabilities: Vulnerability[];
  error?: string;
}

export interface AnalysisResult {
  results: FileAnalysis[];
  summary: AnalysisSummary;
}