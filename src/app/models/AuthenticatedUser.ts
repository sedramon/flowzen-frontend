import { Role, RoleTenantInfo } from "./Role";

export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
    name: string;
    role: Role | string | null;
    scopes?: string[];
    tenant?: string;
    tenantId?: string | null;
    tenantInfo?: RoleTenantInfo | null;
    isGlobalAdmin?: boolean;
}