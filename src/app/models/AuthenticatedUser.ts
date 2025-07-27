import { Role } from "./Role";

export interface AuthenticatedUser {
    sub: string;
    username: string;
    role: Role | string;
    scopes: string[];
    tenant: string;
}