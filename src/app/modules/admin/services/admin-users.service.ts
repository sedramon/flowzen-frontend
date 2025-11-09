import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminUser, AdminUserGroup, AdminUserListQuery } from '../models/admin-user.model';
import { AdminPagination } from '../models/pagination';

export interface AdminCreateUserPayload {
  email: string;
  password: string;
  name?: string;
  tenantId?: string | null;
  role: string;
  scopes?: string[];
  isGlobalAdmin?: boolean;
}

export interface AdminUpdateUserPayload {
  name?: string;
  tenantId?: string | null;
  role?: string;
  scopes?: string[];
  isGlobalAdmin?: boolean;
}

export interface AdminResetPasswordPayload {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;
  private readonly httpOptions = { withCredentials: true };
  listUserGroups(): Observable<AdminUserGroup[]> {
    return this.http
      .get<AdminPagination<AdminUserGroup>>(this.baseUrl, this.httpOptions)
      .pipe(
        map((response) => response.items as AdminUserGroup[]),
        catchError((error) => throwError(() => error)),
      );
  }


  constructor(private readonly http: HttpClient) {}

  listUsers(query: AdminUserListQuery): Observable<AdminPagination<AdminUser>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'tenantId') {
          params = params.set('tenant', String(value));
        } else {
          params = params.set(key, String(value));
        }
      }
    });

    return this.http
      .get<AdminPagination<AdminUser | AdminUserGroup>>(this.baseUrl, {
        params,
        ...this.httpOptions,
      })
      .pipe(
        map((response) => {
          const items = response.items as Array<AdminUser | AdminUserGroup>;
          if (
            Array.isArray(items) &&
            items.length > 0 &&
            typeof (items[0] as AdminUserGroup).users !== 'undefined'
          ) {
            const flattened = (items as AdminUserGroup[]).flatMap((group) => group.users);
            return {
              ...response,
              items: flattened,
            } as AdminPagination<AdminUser>;
          }
          return response as AdminPagination<AdminUser>;
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  createUser(payload: AdminCreateUserPayload): Observable<AdminUser> {
    return this.http
      .post<AdminUser>(this.baseUrl, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateUser(userId: string, payload: AdminUpdateUserPayload): Observable<AdminUser> {
    return this.http
      .patch<AdminUser>(`${this.baseUrl}/${userId}`, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  resetPassword(
    userId: string,
    payload: AdminResetPasswordPayload,
  ): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(
        `${this.baseUrl}/${userId}/reset-password`,
        payload,
        this.httpOptions,
      )
      .pipe(catchError((error) => throwError(() => error)));
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.baseUrl}/${userId}`, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }
}


