import { Scope } from "./Scope";

export interface Role {
    _id?: string;
    name: string;
    availableScopes: Scope[];
    tenant: string;
}