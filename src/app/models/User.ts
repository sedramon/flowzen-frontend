import { Role } from "./Role";
import { Tenant } from "./Tenant";

export interface User {
    _id: string;
    name: string;
    email: string;
    role: Role;
    tenant: Tenant;
}