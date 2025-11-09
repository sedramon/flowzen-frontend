import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminScope } from '../models/admin-scope.model';

export interface AdminCreateScopePayload {
  name: string;
  description?: string;
  category?: 'tenant' | 'global';
}

export type AdminUpdateScopePayload = Partial<AdminCreateScopePayload>;

@Injectable({
  providedIn: 'root',
})
export class AdminScopesService {
  private readonly baseUrl = `${environment.apiUrl}/admin/scopes`;
  private readonly httpOptions = { withCredentials: true };

  constructor(private readonly http: HttpClient) {}

  listScopes(category?: 'tenant' | 'global'): Observable<AdminScope[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }

    return this.http
      .get<AdminScope[]>(this.baseUrl, {
        params,
        ...this.httpOptions,
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  createScope(payload: AdminCreateScopePayload): Observable<AdminScope> {
    return this.http
      .post<AdminScope>(this.baseUrl, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateScope(scopeId: string, payload: AdminUpdateScopePayload): Observable<AdminScope> {
    return this.http
      .patch<AdminScope>(`${this.baseUrl}/${scopeId}`, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteScope(scopeId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/${scopeId}`, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }
}


