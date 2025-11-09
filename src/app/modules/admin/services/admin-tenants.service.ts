import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminTenant,
  AdminTenantOverview,
  TenantStatus,
} from '../models/admin-tenant.model';
import { AdminPagination } from '../models/pagination';

export interface AdminTenantQuery {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  search?: string;
}

export interface AdminCreateTenantPayload {
  name: string;
  companyType?: string;
  street?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  PIB?: string;
  MIB?: string;
}

export interface AdminUpdateTenantLicensePayload {
  hasActiveLicense: boolean;
  licenseStartDate?: string | null;
  licenseExpiryDate?: string | null;
}

export interface AdminTenantSuspendPayload {
  reason?: string;
}

export interface AdminTenantActivatePayload {
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminTenantsService {
  private readonly baseUrl = `${environment.apiUrl}/admin/tenants`;
  private readonly httpOptions = { withCredentials: true };

  constructor(private readonly http: HttpClient) {}

  listTenants(query: AdminTenantQuery): Observable<AdminPagination<AdminTenant>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<AdminPagination<AdminTenant>>(this.baseUrl, {
        params,
        ...this.httpOptions,
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  getOverview(): Observable<AdminTenantOverview> {
    return this.http
      .get<AdminTenantOverview>(`${this.baseUrl}/overview`, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  createTenant(payload: AdminCreateTenantPayload): Observable<AdminTenant> {
    return this.http
      .post<AdminTenant>(this.baseUrl, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  updateLicense(
    tenantId: string,
    payload: AdminUpdateTenantLicensePayload,
  ): Observable<AdminTenant> {
    return this.http
      .patch<AdminTenant>(`${this.baseUrl}/${tenantId}/license`, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  suspendTenant(
    tenantId: string,
    payload: AdminTenantSuspendPayload,
  ): Observable<AdminTenant> {
    return this.http
      .patch<AdminTenant>(`${this.baseUrl}/${tenantId}/suspend`, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }

  activateTenant(
    tenantId: string,
    payload: AdminTenantActivatePayload,
  ): Observable<AdminTenant> {
    return this.http
      .patch<AdminTenant>(`${this.baseUrl}/${tenantId}/activate`, payload, this.httpOptions)
      .pipe(catchError((error) => throwError(() => error)));
  }
}


