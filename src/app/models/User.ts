import { Role } from "./Role";
import { Tenant } from "./Tenant";

export interface User {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    role: Role | string;
    tenant: Tenant | string;
}

