import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Client } from '../../../models/Client';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResponse } from '../../../models/PagedResponse';

@Injectable({
  providedIn: 'root',
})
export class ClientsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

getClients(
  tenant: string,
  search: string,
  page: number,
  limit: number,
  sortBy?: string,
  sortDir?: 'asc'|'desc',
  createdFrom?: Date,
  createdTo?: Date
): Observable<PagedResponse<Client>> {
  let params = new HttpParams()
    .set('tenant', tenant)
    .set('page',   page.toString())
    .set('limit',  limit.toString());

  if (search)    params = params.set('search', search);
  if (sortBy)    params = params.set('sortBy', sortBy);
  if (sortDir)   params = params.set('sortDir', sortDir);
  if (createdFrom) params = params.set('createdFrom', createdFrom.toISOString());
  if (createdTo)   params = params.set('createdTo',   createdTo.toISOString());

  console.log('[ClientsService] GET /clients', params.toString());
  return this.http.get<PagedResponse<Client>>(`${this.apiUrl}/clients`, { params });
}


  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, client);
  }

  getClientsAll(tenant: string) : Observable<Client[]> {
    let params = new HttpParams();
    params = params.set('tenant', tenant);

    return this.http.get<Client[]>(`${this.apiUrl}/clients/all`, { params });
  }

  updateClient(id: string, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${id}`, client);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${id}`);
  }
}
