import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminAuditLog } from '../models/admin-audit-log.model';
import { AdminPagination } from '../models/pagination';

export interface AdminAuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  performedBy?: string;
  tenant?: string;
  timeRange?: '24h' | '7d' | '30d' | 'custom';
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminAuditService {
  private readonly baseUrl = `${environment.apiUrl}/admin/audit`;
  private readonly httpOptions = { withCredentials: true };

  constructor(private readonly http: HttpClient) {}

  listLogs(query: AdminAuditQuery): Observable<AdminPagination<AdminAuditLog>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<AdminPagination<AdminAuditLog>>(this.baseUrl, {
        params,
        ...this.httpOptions,
      })
      .pipe(catchError((error) => throwError(() => error)));
  }
}


