export interface AdminAuditLog {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  tenant?: {
    _id: string | null;
    name: string | null;
    isGlobal?: boolean;
  } | null;
  performedBy?:
    | {
        _id: string;
        email?: string;
        name?: string;
      }
    | string
    | null;
  createdAt: string;
}


