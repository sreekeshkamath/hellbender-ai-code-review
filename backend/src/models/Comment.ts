export interface Comment {
  id: string;
  prId: string;
  author: string;
  content: string;
  createdAt: Date;
  filePath?: string;
  line?: number;
  type: 'user' | 'ai';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  originalCommentId?: string; // Reference to original comment for sync tracking
}
