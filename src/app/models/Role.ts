import { Scope } from "./Scope";

export interface RoleTenantInfo {
    _id: string | null;
    name: string | null;
    isGlobal: boolean;
}

export interface Role {
    _id?: string;
    name: string;
    availableScopes: Scope[];
    tenant?: RoleTenantInfo | null;
    type?: 'tenant' | 'global';
}