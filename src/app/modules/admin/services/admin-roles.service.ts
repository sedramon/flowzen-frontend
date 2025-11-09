import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Role } from '../../../models/Role';

@Injectable({
  providedIn: 'root',
})
export class AdminRolesService {
  private readonly baseUrl = `${environment.apiUrl}/admin/roles`;
  private readonly httpOptions = { withCredentials: true };

  constructor(private readonly http: HttpClient) {}

  findRoles(query: AdminRoleQuery = { type: 'global' }): Observable<Role[]> {
    let params = new HttpParams();

    if (query.tenant !== undefined && query.tenant !== null && query.tenant !== '') {
      params = params.set('tenant', String(query.tenant));
    }

    if (query.type) {
      params = params.set('type', query.type);
    }

    return this.http
      .get<Role[] | RoleGroup[]>(this.baseUrl, {
        params,
        ...this.httpOptions,
      })
      .pipe(
        map((response) => {
          if (
            Array.isArray(response) &&
            response.length > 0 &&
            typeof (response as RoleGroup[])[0]?.roles !== 'undefined'
          ) {
            return (response as RoleGroup[]).flatMap((group) => group.roles);
          }
          return response as Role[];
        }),
      );
  }

  createRole(payload: AdminCreateRolePayload): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, payload, this.httpOptions);
  }

  updateRole(roleId: string, payload: AdminUpdateRolePayload): Observable<Role> {
    return this.http.patch<Role>(`${this.baseUrl}/${roleId}`, payload, this.httpOptions);
  }

  deleteRole(roleId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/${roleId}`,
      this.httpOptions,
    );
  }
}

export interface RoleGroup {
  type: 'global' | 'tenant';
  roles: Role[];
}

export interface AdminRoleQuery {
  tenant?: string | null;
  type?: 'global' | 'tenant';
}

export interface AdminCreateRolePayload {
  name: string;
  availableScopes: string[];
  tenant?: string | null;
}

export interface AdminUpdateRolePayload extends Partial<AdminCreateRolePayload> {}


