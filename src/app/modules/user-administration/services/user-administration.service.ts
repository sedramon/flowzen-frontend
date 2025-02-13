import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environmentDev } from "../../../../environments/environment";
import { User } from "../../../models/User";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Role } from "../../../models/Role";

@Injectable({ providedIn: 'root' })
export class UserAdministrationService {
    private apiUrl = environmentDev.apiUrl;

    private usersSubject = new BehaviorSubject<User[]>([]);
    public users$ = this.usersSubject.asObservable();

    private rolesSubject = new BehaviorSubject<Role[]>([]);
    public roles$ = this.rolesSubject.asObservable();

    constructor(private http: HttpClient) { }

    fetchUsers(tenant: string): Observable<User[]> {
        console.log("Calling API to fetch users for tenant:", tenant);
        return this.http.get<User[]>(`${this.apiUrl}/users/tenant/${tenant}`).pipe(
            tap((users) => this.usersSubject.next(users)) // Čuvanje podataka u BehaviorSubject
        );
    }

    fetchRoles(): Observable<Role[]> {
        console.log("Calling API to fetch roles");
        return this.http.get<Role[]>(`${this.apiUrl}/roles`).pipe(
            tap((roles) => this.rolesSubject.next(roles)) // Čuvanje podataka u BehaviorSubject
        );
    }

    updateRole(roleId: string, updatedData: { name: string; availableScopes: string[] }): Observable<Role> {
        console.log("Updating role:", roleId, updatedData);
        
        return this.http.patch<Role>(`${this.apiUrl}/roles/${roleId}`, updatedData).pipe(
            tap((updatedRole) => {
                // Get the current list of roles
                const currentRoles = this.rolesSubject.getValue();
    
                // Find the existing role to retain its Scope[] structure
                const existingRole = currentRoles.find(role => role._id === roleId);
                
                if (!existingRole) return;
    
                // Convert availableScopes (string[]) back to Scope[]
                const updatedRoleWithScopes: Role = {
                    ...existingRole, // Preserve existing structure
                    name: updatedData.name,
                    availableScopes: existingRole.availableScopes.filter(scope =>
                        updatedData.availableScopes.includes(scope._id) // Retain existing scope objects
                    )
                };
    
                // Replace the role in the BehaviorSubject
                const updatedRoles = currentRoles.map(role =>
                    role._id === roleId ? updatedRoleWithScopes : role
                );
                
                this.rolesSubject.next(updatedRoles);
            })
        );
    }
    
    

    getCurrentRoles(): Role[] {
        return this.rolesSubject.getValue();
    }

    getCurrentUsers(): User[] {
        return this.usersSubject.getValue();
    }

}