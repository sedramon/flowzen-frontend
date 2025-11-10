export type TenantAccessBlockReason =
  | 'unauthenticated'
  | 'missing-tenant'
  | 'suspended'
  | 'pending'
  | 'license-inactive'
  | 'license-expired';

export interface TenantAccessStateDetails {
  status?: 'active' | 'suspended' | 'pending';
  hasActiveLicense?: boolean;
  licenseStartDate?: string | null;
  licenseExpiryDate?: string | null;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
}

export interface TenantAccessState {
  allowed: boolean;
  reason?: TenantAccessBlockReason;
  message?: string;
  tenantId?: string | null;
  tenantName?: string | null;
  details?: TenantAccessStateDetails;
  redirectUrl?: string;
}
