import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environmentDev } from "../../../../environments/environment";
import { User } from "../../../models/User";
import { BehaviorSubject, Observable, tap } from "rxjs";

@Injectable({ providedIn: 'root' })
export class UserAdministrationService {
    private apiUrl = environmentDev.apiUrl;

    private usersSubject = new BehaviorSubject<User[]>([]);
    public users$ = this.usersSubject.asObservable();

    constructor(private http: HttpClient) { }

    fetchUsers(tenant: string): Observable<User[]> {
        console.log("Calling API to fetch users for tenant:", tenant);
        return this.http.get<User[]>(`${this.apiUrl}/users/tenant/${tenant}`).pipe(
            tap((users) => this.usersSubject.next(users)) // Čuvanje podataka u BehaviorSubject
        );
    }

    getCurrentUsers(): User[] {
        return this.usersSubject.getValue();
    }

}