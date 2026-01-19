export interface Approval {
  id: string;
  prId: string;
  originalApprovalId?: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
