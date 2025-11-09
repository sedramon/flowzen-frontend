import { Role, RoleTenantInfo } from '../../../models/Role';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  tenant?: RoleTenantInfo | null;
  role?: Role | string | null;
  scopes: string[];
  isGlobalAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  tenant?: string | null;
  type?: 'global' | 'tenant';
  search?: string;
  role?: string;
  isGlobalAdmin?: boolean;
  email?: string;
}

export interface AdminUserGroup {
  tenant: RoleTenantInfo;
  users: AdminUser[];
}


