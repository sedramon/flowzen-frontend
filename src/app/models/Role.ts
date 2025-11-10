import { Scope } from "./Scope";

export interface RoleTenantInfo {
    _id: string | null;
    tenantId?: string | null;
    name: string | null;
    isGlobal: boolean;
    status?: 'active' | 'suspended' | 'pending';
    hasActiveLicense?: boolean;
    licenseStartDate?: string | null;
    licenseExpiryDate?: string | null;
    suspendedAt?: string | null;
    suspensionReason?: string | null;
}

export interface Role {
    _id?: string;
    name: string;
    availableScopes: Scope[];
    tenant?: RoleTenantInfo | null;
    type?: 'tenant' | 'global';
}