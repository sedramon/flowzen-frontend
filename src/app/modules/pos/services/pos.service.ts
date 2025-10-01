import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { 
  CashSession, 
  CashSessionSummary, 
  CashCountingResult, 
  CashVerificationResult, 
  CashVarianceResult, 
  CashReconciliationResult, 
  DailyCashReport 
} from '../../../models/CashSession';
import { Facility } from '../../../models/Facility';

@Injectable({ providedIn: 'root' })
export class PosService {
  private api = environment.apiUrl + '/pos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Transformiše backend response u frontend model
   */
  private transformCashSession(session: any, facilities: Facility[] = []): CashSession {
    const facilityId = session.facility?._id || session.facility?.id || session.facility;
    const facility = facilities.find(f => f._id === facilityId);
    
    return {
      id: session._id || session.id,
      tenant: session.tenant,
      facility: {
        id: facilityId || '',
        name: facility?.name || session.facility?.name || 'N/A'
      },
      openedBy: this.transformUser(session.openedBy),
      openedAt: session.openedAt,
      openingFloat: session.openingFloat || 0,
      closedBy: session.closedBy ? this.transformUser(session.closedBy) : undefined,
      closedAt: session.closedAt,
      closingCount: session.closingCount,
      totalsByMethod: session.totalsByMethod || this.getDefaultTotalsByMethod(),
      expectedCash: session.expectedCash || 0,
      variance: session.variance || 0,
      status: session.status || 'open',
      note: session.note,
      calculatedTotals: session.calculatedTotals
    };
  }

  /**
   * Transformiše facility objekat
   */
  private transformFacility(facility: any): { id: string; name: string } {
    return {
      id: facility?._id || facility?.id || '',
      name: facility?.name || 'N/A'
    };
  }

  /**
   * Transformiše user objekat
   */
  private transformUser(user: any): { id: string; firstName: string; lastName: string } {
    return {
      id: user?._id || user?.id || '',
      firstName: user?.firstName || 'N/A',
      lastName: user?.lastName || ''
    };
  }

  /**
   * Vraća default totals by method
   */
  private getDefaultTotalsByMethod() {
    return {
      cash: 0,
      card: 0,
      voucher: 0,
      gift: 0,
      bank: 0,
      other: 0
    };
  }

  /**
   * Transformiše facilities array
   */
  private transformFacilities(facilities: any[]): Facility[] {
    return facilities.map((facility: any) => ({
      _id: facility._id,
      name: facility.name || 'N/A',
      address: facility.address || '',
      openingHour: facility.openingHour || '09:00',
      closingHour: facility.closingHour || '18:00',
      tenant: facility.tenant,
      createdAt: facility.createdAt,
      updatedAt: facility.updatedAt
    }));
  }

  // ============================================================================
  // CASH SESSION MANAGEMENT
  // ============================================================================

  /**
   * Otvara novu cash sesiju
   */
  openSession(data: { facility: string; openingFloat: number; note?: string }): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.api}/sessions/open`, data);
  }

  /**
   * Zatvara cash sesiju
   */
  closeSession(id: string, data: { closingCount: number; note?: string }): Observable<CashSessionSummary> {
    return this.http.post<CashSessionSummary>(`${this.api}/sessions/${id}/close`, data);
  }

  /**
   * Dohvata sve sesije sa filterima
   */
  getSessions(params: { status?: string; facility?: string; employee?: string }): Observable<CashSession[]> {
    return this.http.get<CashSession[]>(`${this.api}/sessions`, { params });
  }

  /**
   * Dohvata sesiju po ID
   */
  getSession(id: string): Observable<CashSession> {
    return this.http.get<CashSession>(`${this.api}/sessions/${id}`);
  }

  /**
   * Dohvata trenutnu aktivnu sesiju
   */
  getCurrentSession(facilities: Facility[] = []): Observable<CashSession | null> {
    return this.http.get<CashSession | null>(`${this.api}/sessions/current`).pipe(
      map((response: any) => {
        if (response && response.data) {
          return this.transformCashSession(response.data, facilities);
        }
        if (response) {
          return this.transformCashSession(response, facilities);
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error getting current session:', error);
        return of(null);
      })
    );
  }

  /**
   * Dohvata poslednje sesije
   */
  getRecentSessions(limit: number = 10, facilities: Facility[] = []): Observable<CashSession[]> {
    return this.http.get<CashSession[]>(`${this.api}/sessions`, { 
      params: { limit: limit.toString() } 
    }).pipe(
      map((response: any) => {
        let sessions = [];
        if (Array.isArray(response)) {
          sessions = response;
        } else if (response && Array.isArray(response.data)) {
          sessions = response.data;
        }
        return sessions.map((session: any) => this.transformCashSession(session, facilities));
      }),
      catchError((error) => {
        console.error('Error getting recent sessions:', error);
        return of([]);
      })
    );
  }

  // ============================================================================
  // CASH COUNTING & VERIFICATION
  // ============================================================================

  /**
   * Broji cash u sesiji
   */
  countCash(sessionId: string, countedCash: number): Observable<CashCountingResult> {
    return this.http.post<CashCountingResult>(`${this.api}/sessions/${sessionId}/count-cash`, { countedCash });
  }

  /**
   * Verifikuje brojanje cash-a
   */
  verifyCashCount(sessionId: string, actualCash: number, note?: string): Observable<CashVerificationResult> {
    return this.http.post<CashVerificationResult>(`${this.api}/sessions/${sessionId}/verify-cash`, { 
      actualCash, 
      note 
    });
  }

  /**
   * Rukuje variance (nedostatak/višak novca)
   */
  handleCashVariance(sessionId: string, actualCash: number, action: string, reason: string): Observable<CashVarianceResult> {
    return this.http.post<CashVarianceResult>(`${this.api}/sessions/${sessionId}/handle-variance`, { 
      actualCash, 
      action, 
      reason 
    });
  }

  // ============================================================================
  // CASH RECONCILIATION
  // ============================================================================

  /**
   * Usklađuje cash za sesiju
   */
  reconcileSession(sessionId: string): Observable<CashReconciliationResult> {
    return this.http.get<CashReconciliationResult>(`${this.api}/sessions/${sessionId}/reconcile`);
  }

  // ============================================================================
  // CASH REPORTS
  // ============================================================================

  /**
   * Dohvata dnevni cash izveštaj
   */
  getDailyCashReport(facility: string, date: string): Observable<DailyCashReport> {
    return this.http.get<DailyCashReport>(`${this.api}/sessions/reports/daily`, { 
      params: { facility, date } 
    });
  }

  /**
   * Dohvata nedeljni cash izveštaj
   */
  getWeeklyCashReport(facility: string, week: string): Observable<any> {
    return this.http.get(`${this.api}/sessions/reports/weekly`, { 
      params: { facility, week } 
    });
  }

  /**
   * Dohvata mesečni cash izveštaj
   */
  getMonthlyCashReport(facility: string, month: string): Observable<any> {
    return this.http.get(`${this.api}/sessions/reports/monthly`, { 
      params: { facility, month } 
    });
  }

  /**
   * Dohvata današnje cash statistike
   */
  getTodayCashStats(facilityId?: string): Observable<{
    totalSessions: number;
    totalCash: number;
    totalVariance: number;
    averageVariance: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<any>(`${this.api}/sessions/reports/daily`, { 
      params: { 
        facility: facilityId || '68d855f9f07f767dc2582ba2', // Default to Test Facility
        date: today 
      } 
    }).pipe(
      // Transform response to stats format
      map((response: any) => {
        if (response) {
          return {
            totalSessions: response.sessionCount || 0,
            totalCash: response.summary?.totalActualCash || 0,
            totalVariance: response.summary?.totalVariance || 0,
            averageVariance: response.summary?.variancePercentage || 0
          };
        }
        return {
          totalSessions: 0,
          totalCash: 0,
          totalVariance: 0,
          averageVariance: 0
        };
      }),
      catchError((error) => {
        console.error('Error getting today cash stats:', error);
        return of({
          totalSessions: 0,
          totalCash: 0,
          totalVariance: 0,
          averageVariance: 0
        });
      })
    );
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
  getFacilities(tenant?: string): Observable<Facility[]> {
    const t = tenant || this.authService.getCurrentUser()?.tenant || '';
    return this.http.get(`${environment.apiUrl}/facility`, { params: { tenant: t } }).pipe(
      map((response: any) => {
        const facilities = Array.isArray(response) ? response : (response?.data || []);
        return this.transformFacilities(facilities);
      }),
      catchError((error) => {
        console.error('Error getting facilities:', error);
        return of([]);
      })
    );
  }

  // ============================================================================
  // ADDITIONAL POS METHODS
  // ============================================================================

  getClients(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/clients`, { params: { tenant } });
  }

  getServices(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/services`, { params: { tenant } });
  }

  getArticles(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/articles`, { params: { tenant } });
  }

  // ============================================================================
  // REPORTS METHODS
  // ============================================================================

  getReports(tenant: string, filters: any): Observable<any> {
    return this.http.get(`${this.api}/sessions/reports`, { 
      params: { 
        tenant, 
        ...filters 
      } 
    });
  }


  // ============================================================================
  // FISCALIZATION METHODS
  // ============================================================================

  fiscalizeSale(saleId: string, facility: string): Observable<any> {
    return this.http.post(`${this.api}/sales/${saleId}/fiscalize`, { facility });
  }

  resetFiscalization(saleId: string): Observable<any> {
    return this.http.post(`${this.api}/sales/${saleId}/reset-fiscalization`, {});
  }

  getFiscalLogs(params: any): Observable<any> {
    return this.http.get(`${this.api}/fiscal-logs`, { params });
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  getAnalytics(filters: any): Observable<any> {
    return this.http.get(`${this.api}/analytics`, { params: filters });
  }

  getCashFlowAnalytics(facility: string, period: string): Observable<any> {
    return this.http.get(`${this.api}/analytics/cash-flow`, { 
      params: { facility, period } 
    });
  }

  getSalesAnalytics(facility: string, period: string): Observable<any> {
    return this.http.get(`${this.api}/analytics/sales`, { 
      params: { facility, period } 
    });
  }
}
