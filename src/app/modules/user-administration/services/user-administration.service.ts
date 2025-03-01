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

    updateRole(roleId: string, updatedData: { name: string; availableScopes: string[], tenant: string }): Observable<Role> {
        console.log("Updating role:", roleId, updatedData);
        
        return this.http.patch<Role>(`${this.apiUrl}/roles/${roleId}`, updatedData).pipe(
            tap((updatedRole) => {
                const currentRoles = this.rolesSubject.getValue();
                const updatedRoles = currentRoles.map(role =>
                    role._id === roleId ? updatedRole : role
                );
                this.rolesSubject.next(updatedRoles);
            })
        );
    }

    updateUser(userId: string, updatedData: { name: string; role: string, tenant: string }): Observable<User> {
        console.log("Updating user:", userId, updatedData);
        return this.http.patch<User>(`${this.apiUrl}/users/${userId}`, updatedData).pipe(
            tap((updatedUser) => {
                console.log('Backend response: ' + updatedUser._id);
                const currentUsers = this.usersSubject.getValue();
                const updatedUsers = currentUsers.map(user =>
                    user._id === userId ? updatedUser : user
                );
                this.usersSubject.next(updatedUsers);
            })
        );
    }

    createUser(user: User): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/users`, user).pipe(
            tap((createdUser) => {
                const updatedUsers = [...this.usersSubject.getValue(), createdUser];
                this.usersSubject.next(updatedUsers);
            })
        )
    }

    createRole(role: Role): Observable<Role> {
        return this.http.post<Role>(`${this.apiUrl}/roles`, role).pipe(
            tap((createdRole) => {
                const updatedRoles = [...this.rolesSubject.getValue(), createdRole];
                this.rolesSubject.next(updatedRoles);
            })
        )
    }
    
    

    getCurrentRoles(): Role[] {
        return this.rolesSubject.getValue();
    }

    getCurrentUsers(): User[] {
        return this.usersSubject.getValue();
    }

    deleteUser(id: string): Observable<User> {
        return this.http.delete<User>(`${this.apiUrl}/users/${id}`);
    }

    deleteRole(id: string): Observable<Role> {
        return this.http.delete<Role>(`${this.apiUrl}/roles/${id}`);
    }

}