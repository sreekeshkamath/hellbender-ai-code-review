import { Vulnerability } from './Vulnerability';

export interface Issue {
  line: number;
  type: string; // 'bug' | 'performance' | 'style' | 'security' | 'bestpractice';
  severity: string; // 'low' | 'medium' | 'high' | 'critical';
  message: string;
  code: string;
  suggestion: string;
}

export interface AnalysisResult {
  file: string;
  score?: number;
  issues?: Issue[];
  strengths?: string[];
  summary?: string;
  vulnerabilities?: Vulnerability[];
  error?: string;
}

export interface AnalysisSummary {
  overallScore: number;
  totalFiles: number;
  vulnerabilityCount: number;
  reviewedAt: string;
}