import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { User } from "../../../models/User";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Role } from "../../../models/Role";
import { AuthenticatedUser } from "../../../models/AuthenticatedUser";
import { AuthService } from "../../../core/services/auth.service";

@Injectable({ providedIn: 'root' })
export class UserAdministrationService {
    private apiUrl = environment.apiUrl;

    private usersSubject = new BehaviorSubject<User[]>([]);
    public users$ = this.usersSubject.asObservable();

    private rolesSubject = new BehaviorSubject<Role[]>([]);
    public roles$ = this.rolesSubject.asObservable();

    constructor(private http: HttpClient, private authService: AuthService) { }

    fetchUsers(tenant: string): Observable<User[]> {
        if(this.usersSubject.value.length > 0 ) {
            console.log('RETURNING CACHED USERS');
            return this.users$;
        }
        
        return this.http.get<User[]>(`${this.apiUrl}/users/tenant/${tenant}`).pipe(
            tap((users) => this.usersSubject.next(users)) // Čuvanje podataka u BehaviorSubject
        );
    }

    fetchRoles(tenant: string): Observable<Role[]> {
        if(this.rolesSubject.value.length > 0 ) {
            console.log('RETURNING CACHED ROLES');
            return this.roles$;
        }

        const params = new HttpParams().set('tenant', tenant);

        return this.http.get<Role[]>(`${this.apiUrl}/roles`, {params}).pipe(
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

                // If the updated user is the currently authenticated user, update the AuthService user
                const currentAuthUser = this.authService.getCurrentUser();
                if (currentAuthUser && currentAuthUser.sub === updatedUser._id) {
                    const updatedAuthUser = this.mapUserToAuthenticatedUser(updatedUser);
                    this.authService.updateCurrentUser(updatedAuthUser);
                }
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

    mapUserToAuthenticatedUser(user: User): AuthenticatedUser {
        return {
            sub: user._id!, // assuming _id exists after an update
            username: user.name,
            role: typeof user.role === 'string' ? { _id: user.role } as Role : user.role,
            tenant:
                typeof user.tenant === 'string'
                    ? user.tenant
                    : // If tenant is an object, assume it has an _id property; adjust if needed
                    (user.tenant as any)._id || user.tenant.toString(),
        };
    }

}