import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SettingsService } from '../../settings/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class PosService {
  private api = environment.apiUrl + '/pos';

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
    private authService: AuthService
  ) {}

  // Cash Sessions
  openSession(data: any): Observable<any> {
    return this.http.post(`${this.api}/sessions/open`, data);
  }
  closeSession(id: string, data: any): Observable<any> {
    return this.http.post(`${this.api}/sessions/${id}/close`, data);
  }
  getSessions(params: any): Observable<any> {
    return this.http.get(`${this.api}/sessions`, { params });
  }
  getSession(id: string): Observable<any> {
    return this.http.get(`${this.api}/sessions/${id}`);
  }

  // Sales
  createSale(data: any): Observable<any> {
    return this.http.post(`${this.api}/sales`, data);
  }
  refundSale(id: string, data: any): Observable<any> {
    return this.http.post(`${this.api}/sales/${id}/refund`, data);
  }
  getSales(params: any): Observable<any> {
    return this.http.get(`${this.api}/sales`, { params });
  }
  getSale(id: string): Observable<any> {
    return this.http.get(`${this.api}/sales/${id}`);
  }
  getReceipt(id: string): Observable<any> {
    return this.http.get(`${this.api}/sales/${id}/receipt`, { responseType: 'text' });
  }

  // Reports
  getDailyReport(params: any): Observable<any> {
    return this.http.get(`${this.api}/reports/daily`, { params });
  }
  getZReport(sessionId: string): Observable<any> {
    return this.http.get(`${this.api}/reports/session/${sessionId}/z`);
  }

  // Settings
  getSettings(facility: string): Observable<any> {
    return this.http.get(`${this.api}/settings`, { params: { facility } });
  }
  updateSettings(data: any): Observable<any> {
    return this.http.put(`${this.api}/settings`, data);
  }

  // Additional methods for POS components
  getFacilities(tenant?: string): Observable<any> {
    const t = tenant || this.authService.getCurrentUser()?.tenant || '';
    return this.settingsService.getAllFacilities(t);
  }

  getClients(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/clients`, { params: { tenant } });
  }

  getServices(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/services`, { params: { tenant } });
  }

  getArticles(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/articles`, { params: { tenant } });
  }

  getReports(tenant: string, filters: any): Observable<any> {
    return this.http.get(`${this.api}/reports`, { 
      params: { 
        tenant, 
        ...filters 
      } 
    });
  }

  exportReports(data: any[]): Observable<any> {
    return this.http.post(`${this.api}/reports/export`, data, {
      responseType: 'blob'
    });
  }

  // Fiscalization
  fiscalizeSale(saleId: string, facility: string): Observable<any> {
    return this.http.post(`${this.api}/sales/${saleId}/fiscalize`, { facility });
  }

  getFiscalLogs(params: any): Observable<any> {
    return this.http.get(`${this.api}/fiscal-logs`, { params });
  }
}
