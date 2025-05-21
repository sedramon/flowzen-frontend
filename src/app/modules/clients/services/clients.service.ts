import { Injectable } from '@angular/core';
import { environmentDev } from '../../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Client } from '../../../models/Client';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = environmentDev.apiUrl;

  private clientsSubject = new BehaviorSubject<Client[]>([]);
  clients$ = this.clientsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllClients(tenant: string): Observable<Client[]> {
    // If cached data exists and is not empty, return it
    if (this.clientsSubject.value.length > 0) {
      console.log('RETURNING CACHED CLIENTS');
      return this.clients$;
    }

    const params = new HttpParams().set('tenant', tenant);

    // If no cached data, make the API call and update the BehaviorSubject
    return this.http.get<Client[]>(`${this.apiUrl}/clients`, { params }).pipe(
      tap((clients) => {
        this.clientsSubject.next(clients);
        console.log('FETCHED CLIENTS');
      })
    );
  }

  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, client).pipe(
      tap((newClient) => {
        const list = this.clientsSubject.value;
        this.clientsSubject.next([...list, newClient]);
      })
    );
  }

  updateClient(id: string, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${id}`, client).pipe(
      tap((updated) => {
        const list = this.clientsSubject.value.map((c) =>
          c._id === id ? updated : c
        );
        this.clientsSubject.next(list);
      })
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`).pipe(
      tap(() => {
        const list = this.clientsSubject.value.filter((c) => c._id !== id);
        this.clientsSubject.next(list);
      })
    );
  }
}
