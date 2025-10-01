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
  DailyCashReport,
  OpenSessionRequest,
  CloseSessionRequest,
  CashCountingRequest,
  CashVerificationRequest,
  CashVarianceRequest,
  PaymentTotals,
  VarianceAction
} from '../../../models/CashSession';
import { Facility } from '../../../models/Facility';
import { 
  Sale, 
  CreateSaleRequest, 
  RefundSaleRequest, 
  SaleResponse, 
  RefundResponse, 
  FiscalResponse,
  PosApiResponse 
} from '../../../models/Sale';

/**
 * POS Service
 * 
 * Centralized service for all Point of Sale operations including:
 * - Cash session management (open, close, counting, verification)
 * - Sales transactions (create, refund, fiscalize)
 * - Reports and analytics
 * - Settings management
 * 
 * This service handles communication with the POS backend API
 * and provides data transformation for frontend components.
 */
@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly api = environment.apiUrl + '/pos';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
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
    
    const transformedOpenedBy = this.transformUser(session.openedBy);
    const transformedClosedBy = session.closedBy ? this.transformUser(session.closedBy) : undefined;
    
    const result = {
      id: session._id || session.id,
      tenant: session.tenant,
      facility: {
        id: facilityId || '',
        name: facility?.name || session.facility?.name || 'N/A'
      },
      openedBy: transformedOpenedBy,
      openedAt: session.openedAt,
      openingFloat: session.openingFloat || 0,
      closedBy: transformedClosedBy,
      closedAt: session.closedAt,
      closingCount: session.closingCount,
      totalsByMethod: session.totalsByMethod || this.getDefaultTotalsByMethod(),
      expectedCash: session.expectedCash || 0,
      variance: session.variance || 0,
      status: session.status || 'open',
      note: session.note,
      calculatedTotals: session.calculatedTotals,
      // Virtual fields from backend
      duration: session.duration,
      totalTransactions: session.totalTransactions,
      variancePercentage: session.variancePercentage,
      hasSignificantVariance: session.hasSignificantVariance
    };
    
    return result;
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
    // User schema has 'name' field, not 'firstName' and 'lastName'
    const fullName = user?.name || 'N/A';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'N/A';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      id: user?._id || user?.id || '',
      firstName: firstName,
      lastName: lastName
    };
  }

  /**
   * Vraća default totals by method
   */
  private getDefaultTotalsByMethod(): PaymentTotals {
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
   * Open a new cash session
   * @param data - Session opening data
   * @returns Observable with created session ID
   */
  openSession(data: OpenSessionRequest): Observable<{ id: string }> {
    return this.http.post<PosApiResponse<{ id: string }>>(`${this.api}/sessions/open`, data).pipe(
      map((response: PosApiResponse<{ id: string }>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to open session');
      }),
      catchError((error) => {
        console.error('Error opening session:', error);
        throw error;
      })
    );
  }

  /**
   * Close a cash session
   * @param id - Session ID
   * @param data - Session closing data
   * @returns Observable with session summary
   */
  closeSession(id: string, data: CloseSessionRequest): Observable<CashSessionSummary> {
    return this.http.post<PosApiResponse<CashSessionSummary>>(`${this.api}/sessions/${id}/close`, data).pipe(
      map((response: PosApiResponse<CashSessionSummary>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to close session');
      }),
      catchError((error) => {
        console.error('Error closing session:', error);
        throw error;
      })
    );
  }


  /**
   * Dohvata sve sesije sa filterima
   */
  getSessions(params: { status?: string; facility?: string; employee?: string }): Observable<CashSession[]> {
    return this.http.get<any>(`${this.api}/sessions`, { params }).pipe(
      map((response: any) => {
        // Extract data from backend response format
        if (response && response.success && Array.isArray(response.data)) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      }),
      catchError((error) => {
        console.error('Error getting sessions:', error);
        throw error;
      })
    );
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
  getCurrentSession(facilityId?: string, facilities: Facility[] = []): Observable<CashSession | null> {
    const params: any = {};
    if (facilityId) {
      params.facility = facilityId;
    }
    
    return this.http.get<CashSession | null>(`${this.api}/sessions/current`, { params }).pipe(
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
   * @param sessionId - Session ID
   * @param data - Cash counting data
   * @returns Observable with counting results
   */
  countCash(sessionId: string, data: CashCountingRequest): Observable<CashCountingResult> {
    return this.http.post<CashCountingResult>(`${this.api}/sessions/${sessionId}/count-cash`, data);
  }

  /**
   * Verifikuje brojanje cash-a
   * @param sessionId - Session ID
   * @param data - Cash verification data
   * @returns Observable with verification results
   */
  verifyCashCount(sessionId: string, data: CashVerificationRequest): Observable<CashVerificationResult> {
    return this.http.post<CashVerificationResult>(`${this.api}/sessions/${sessionId}/verify-cash`, data);
  }

  /**
   * Rukuje variance (nedostatak/višak novca)
   * @param sessionId - Session ID
   * @param data - Variance handling data
   * @returns Observable with variance handling results
   */
  handleCashVariance(sessionId: string, data: CashVarianceRequest): Observable<CashVarianceResult> {
    return this.http.post<CashVarianceResult>(`${this.api}/sessions/${sessionId}/handle-variance`, data);
  }

  // ============================================================================
  // CASH RECONCILIATION
  // ============================================================================

  /**
   * Usklađuje cash za sesiju
   * @param sessionId - Session ID
   * @returns Observable with reconciliation results
   */
  reconcileSession(sessionId: string): Observable<CashReconciliationResult> {
    return this.http.get<CashReconciliationResult>(`${this.api}/sessions/${sessionId}/reconcile`);
  }

  // ============================================================================
  // CASH REPORTS
  // ============================================================================

  /**
   * Dohvata dnevni cash izveštaj
   * @param facility - Facility ID
   * @param date - Report date
   * @returns Observable with daily cash report
   */
  getDailyCashReport(facility: string, date: string): Observable<DailyCashReport> {
    return this.http.get<DailyCashReport>(`${this.api}/sessions/reports/daily`, { 
      params: { facility, date } 
    }).pipe(
      catchError((error) => {
        console.error('Error getting daily cash report:', error);
        throw error;
      })
    );
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

  // ============================================================================
  // SALES MANAGEMENT
  // ============================================================================

  /**
   * Create a new sale transaction
   * @param data - Sale creation data
   * @returns Observable with created sale data
   */
  createSale(data: CreateSaleRequest): Observable<SaleResponse> {
    return this.http.post<PosApiResponse<SaleResponse>>(`${this.api}/sales`, data).pipe(
      map((response: PosApiResponse<SaleResponse>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create sale');
      }),
      catchError((error) => {
        console.error('Error creating sale:', error);
        throw error;
      })
    );
  }

  /**
   * Refund a sale transaction
   * @param id - Sale ID to refund
   * @param data - Refund data
   * @returns Observable with refund result
   */
  refundSale(id: string, data: RefundSaleRequest): Observable<RefundResponse> {
    return this.http.post<PosApiResponse<RefundResponse>>(`${this.api}/sales/${id}/refund`, data).pipe(
      map((response: PosApiResponse<RefundResponse>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to refund sale');
      }),
      catchError((error) => {
        console.error('Error refunding sale:', error);
        throw error;
      })
    );
  }

  /**
   * Get sales with optional filtering
   * @param params - Query parameters
   * @returns Observable with sales array
   */
  getSales(params: any): Observable<Sale[]> {
    return this.http.get<PosApiResponse<Sale[]>>(`${this.api}/sales`, { params }).pipe(
      map((response: PosApiResponse<Sale[]>) => {
        if (response.success && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error getting sales:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a specific sale by ID
   * @param id - Sale ID
   * @returns Observable with sale data
   */
  getSale(id: string): Observable<Sale> {
    return this.http.get<PosApiResponse<Sale>>(`${this.api}/sales/${id}`).pipe(
      map((response: PosApiResponse<Sale>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Sale not found');
      }),
      catchError((error) => {
        console.error('Error getting sale:', error);
        throw error;
      })
    );
  }

  /**
   * Get receipt for a sale
   * @param id - Sale ID
   * @returns Observable with receipt HTML
   */
  getReceipt(id: string): Observable<any> {
    return this.http.get(`${this.api}/sales/${id}/receipt`, { responseType: 'text' }).pipe(
      map((response: any) => {
        // Handle new API response format
        if (response && typeof response === 'object' && response.success && response.data) {
          return response.data;
        }
        // Fallback for direct response (backward compatibility)
        return response;
      }),
      catchError((error) => {
        console.error('Error getting receipt:', error);
        throw error;
      })
    );
  }

  // Reports
  getDailyReport(params: any): Observable<any> {
    return this.http.get(`${this.api}/reports/daily`, { params }).pipe(
      map((response: any) => {
        // Extract data from backend response format
        if (response && response.success && response.data) {
          return response.data;
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error getting daily report:', error);
        throw error;
      })
    );
  }
  getZReport(sessionId: string): Observable<any> {
    return this.http.get(`${this.api}/reports/session/${sessionId}/z`).pipe(
      map((response: any) => {
        // Extract data from backend response format
        if (response && response.success && response.data) {
          return response.data;
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error getting Z report:', error);
        throw error;
      })
    );
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
    return this.http.get(`${environment.apiUrl}/clients`, { params: { tenant } }).pipe(
      map((response: any) => {
        // Handle paginated response
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Handle direct array response
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error getting clients:', error);
        return of([]);
      })
    );
  }

  getServices(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/services`, { params: { tenant } }).pipe(
      map((response: any) => {
        // Handle paginated response
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Handle direct array response
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error getting services:', error);
        return of([]);
      })
    );
  }

  getArticles(tenant: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/articles`, { params: { tenant } }).pipe(
      map((response: any) => {
        // Handle paginated response
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Handle direct array response
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error getting articles:', error);
        return of([]);
      })
    );
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

  /**
   * Fiscalize a sale transaction
   * @param saleId - Sale ID to fiscalize
   * @param facility - Facility ID
   * @returns Observable with fiscalization result
   */
  fiscalizeSale(saleId: string, facility: string): Observable<FiscalResponse> {
    return this.http.post<PosApiResponse<FiscalResponse>>(`${this.api}/sales/${saleId}/fiscalize`, { facility }).pipe(
      map((response: PosApiResponse<FiscalResponse>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fiscalize sale');
      }),
      catchError((error) => {
        console.error('Error fiscalizing sale:', error);
        throw error;
      })
    );
  }

  /**
   * Reset fiscalization for a sale
   * @param saleId - Sale ID
   * @returns Observable with reset result
   */
  resetFiscalization(saleId: string): Observable<any> {
    return this.http.post<any>(`${this.api}/sales/${saleId}/reset-fiscalization`, {}).pipe(
      map((response: any) => {
        // Handle new API response format
        if (response && response.success && response.data) {
          return response.data;
        }
        // Fallback for direct response (backward compatibility)
        return response;
      }),
      catchError((error) => {
        console.error('Error resetting fiscalization:', error);
        throw error;
      })
    );
  }

  getFiscalLogs(params: any): Observable<any> {
    return this.http.get(`${this.api}/fiscal-logs`, { params });
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  /**
   * Get general analytics data
   * @param filters - Analytics filters
   * @returns Observable with analytics data
   */
  getAnalytics(filters: any): Observable<any> {
    return this.http.get<PosApiResponse<any>>(`${this.api}/analytics`, { params: filters }).pipe(
      map((response: PosApiResponse<any>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error getting analytics:', error);
        return of(null);
      })
    );
  }

  /**
   * Get cash flow analytics
   * @param facility - Facility ID
   * @param period - Analytics period
   * @returns Observable with cash flow analytics
   */
  getCashFlowAnalytics(facility: string, period: string): Observable<any> {
    return this.http.get<PosApiResponse<any>>(`${this.api}/analytics/cash-flow`, { 
      params: { facility, period } 
    }).pipe(
      map((response: PosApiResponse<any>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error getting cash flow analytics:', error);
        return of(null);
      })
    );
  }

  /**
   * Get sales analytics
   * @param facility - Facility ID
   * @param period - Analytics period
   * @returns Observable with sales analytics
   */
  getSalesAnalytics(facility: string, period: string): Observable<any> {
    return this.http.get<PosApiResponse<any>>(`${this.api}/analytics/sales`, { 
      params: { facility, period } 
    }).pipe(
      map((response: PosApiResponse<any>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error getting sales analytics:', error);
        return of(null);
      })
    );
  }
}
