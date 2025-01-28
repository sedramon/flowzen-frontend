import { Role } from "./Role";
import { Tenant } from "./Tenant";

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    tenant: Tenant;
}