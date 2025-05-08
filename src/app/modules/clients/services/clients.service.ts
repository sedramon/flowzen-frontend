import { Injectable } from "@angular/core";
import { environmentDev } from "../../../../environments/environment";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Client } from "../../../models/Client";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: "root",
})
export class ClientsService {
    private apiUrl = environmentDev.apiUrl

    private clientsSubject = new BehaviorSubject<Client[]>([])
    clients$ = this.clientsSubject.asObservable()

    constructor(private http: HttpClient) { }

    getAllClients(): Observable<Client[]> {
        // If cached data exists and is not empty, return it
        if (this.clientsSubject.value.length > 0) {
            console.log("RETURNING CACHED CLIENTS")
            return this.clients$;
        }

        // If no cached data, make the API call and update the BehaviorSubject
        return this.http.get<Client[]>(`${this.apiUrl}/clients`).pipe(
            tap((clients) => {
                this.clientsSubject.next(clients);
                console.log("FETCHED CLIENTS")
            })
        );
    }
}