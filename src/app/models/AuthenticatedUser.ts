import { Role } from "./Role";

export interface AuthenticatedUser {
    sub: string;
    username: string;
    role: Role;
    tenant: string;
}