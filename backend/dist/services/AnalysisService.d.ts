import { FileAnalysis } from '../models/AnalysisResult';
export declare class AnalysisService {
    private static openai;
    static analyzeCode(content: string, filePath: string, model: string): Promise<FileAnalysis>;
}
