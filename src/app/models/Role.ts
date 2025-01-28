import { Scope } from "./Scope";

export interface Role {
    id: number;
    name: string;
    availableScopes: Scope[];
    tenant: string;
}