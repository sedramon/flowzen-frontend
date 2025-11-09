export type TenantStatus = 'active' | 'suspended' | 'pending';

export interface AdminTenant {
  _id: string;
  name: string;
  companyType?: string;
  street?: string;
  city?: string;
  country?: string;
  PIB?: string | null;
  MIB?: string | null;
  status: TenantStatus;
  hasActiveLicense?: boolean;
  licenseStartDate?: string | null;
  licenseExpiryDate?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  suspendedBy?:
    | {
        _id: string;
        email?: string;
        name?: string;
      }
    | string
    | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTenantOverview {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  licensesExpiringSoon: number;
  recentTenants: AdminTenant[];
}


