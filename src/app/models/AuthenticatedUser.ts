import { Role } from "./Role";

export interface AuthenticatedUser {
    userId: string;
    email: string;
    name: string;
    role: Role | string;
    scopes?: string[];
    tenant?: string;
}