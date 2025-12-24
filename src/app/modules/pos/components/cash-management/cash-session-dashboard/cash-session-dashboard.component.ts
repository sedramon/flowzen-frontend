import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

// Service imports
import { PosService } from '../../../services/pos.service';
import { AuthService } from '../../../../../core/services/auth.service';

// Model imports
import { CashSession, OpenSessionRequest, CashSessionSummary } from '../../../../../models/CashSession';
import { Facility } from '../../../../../models/Facility';

// Dialog imports
import { OpenSessionDialogComponent } from '../open-session-dialog/open-session-dialog.component';
import { CloseSessionDialogComponent } from '../close-session-dialog/close-session-dialog.component';
import { CashCountingDialogComponent } from '../cash-counting-dialog/cash-counting-dialog.component';
import { CashReconciliationDialogComponent } from '../cash-reconciliation-dialog/cash-reconciliation-dialog.component';

/**
 * Today's Statistics Interface
 */
interface TodayStats {
  totalSessions: number;
  totalCash: number;
  totalVariance: number;
  averageVariance: number;
}

/**
 * Cash Session Dashboard Component
 * 
 * Glavna komponenta za upravljanje cash sesijama u POS sistemu.
 * Omogućava otvaranje/zatvaranje sesija, brojanje cash-a i usklađivanje.
 * 
 * Funkcionalnosti:
 * - Prikaz trenutne sesije
 * - Otvaranje/zatvaranje sesija
 * - Brojanje cash-a
 * - Usklađivanje variance
 * - Statistike za danas
 * - Pregled poslednjih sesija
 */
@Component({
  selector: 'app-cash-session-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule
  ],
  providers: [DialogService, MessageService],
  templateUrl: './cash-session-dashboard.component.html',
  styleUrls: ['./cash-session-dashboard.component.scss']
})
export class CashSessionDashboardComponent implements OnInit, OnDestroy {
  
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  
  private readonly destroy$ = new Subject<void>();
  
  // Data
  currentSession: CashSession | null = null;
  recentSessions: CashSession[] = [];
  facilities: Facility[] = [];
  
  // Loading states
  loading = true;
  sessionLoading = false;
  
  // Statistics
  todayStats: TodayStats = {
    totalSessions: 0,
    totalCash: 0,
    totalVariance: 0,
    averageVariance: 0
  };

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private readonly posService: PosService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load all required data for dashboard
   */
  private loadDashboardData(): void {
    this.loading = true;
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.showError('Korisnik nije prijavljen');
      this.loading = false;
      return;
    }

    this.posService.getFacilities(currentUser.tenant ?? this.authService.getCurrentTenantId() ?? undefined)
      .pipe(
        switchMap(facilities => {
          this.facilities = facilities || [];
          const facilityId = facilities.length > 0 ? facilities[0]._id : '';
          
          return forkJoin({
            currentSession: this.posService.getCurrentSession(facilityId, facilities),
            recentSessions: this.posService.getRecentSessions(10, facilities),
            todayStats: this.posService.getTodayCashStats(facilityId)
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => this.handleDashboardDataSuccess(data),
        error: (error) => this.handleDashboardDataError(error)
      });
  }

  /**
   * Handle successful dashboard data loading
   * @param data - Loaded data
   */
  private handleDashboardDataSuccess(data: any): void {
    // Proveri da li je currentSession stvarno validna sesija
    if (data.currentSession && data.currentSession.id && data.currentSession.status === 'open') {
      this.currentSession = data.currentSession;
    } else {
      this.currentSession = null;
    }
    
    this.recentSessions = data.recentSessions || [];
    this.todayStats = data.todayStats || this.todayStats;
    this.loading = false;
  }

  /**
   * Handle dashboard data loading error
   * @param error - Error object
   */
  private handleDashboardDataError(error: any): void {
    console.error('Error loading dashboard data:', error);
    this.showError('Greška pri učitavanju podataka');
    this.loading = false;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Otvara dialog za otvaranje nove sesije
   */
  openNewSession(): void {
    const ref = this.dialogService.open(OpenSessionDialogComponent, {
      header: 'Otvaranje sesije',
      width: '500px',
      data: { facilities: this.facilities }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result) {
          this.loadDashboardData();
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Sesija uspešno otvorena'
          });
        }
      });
    }
  }

  /**
   * Zatvara trenutnu aktivnu sesiju
   */
  closeCurrentSession(): void {
    if (!this.currentSession) return;
    
    const ref = this.dialogService.open(CloseSessionDialogComponent, {
      header: 'Zatvaranje sesije',
      width: '600px',
      data: { session: this.currentSession }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result) {
          this.loadDashboardData();
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Sesija uspešno zatvorena'
          });
        }
      });
    }
  }

  // ============================================================================
  // CASH OPERATIONS
  // ============================================================================

  /**
   * Otvara dialog za brojanje cash-a
   */
  countCash(): void {
    if (!this.currentSession) return;

    const ref = this.dialogService.open(CashCountingDialogComponent, {
      header: 'Brojanje cash-a',
      width: '500px',
      data: { session: this.currentSession }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result) {
          this.loadDashboardData();
        }
      });
    }
  }

  /**
   * Otvara dialog za usklađivanje cash-a
   */
  reconcileCash(session?: CashSession): void {
    const targetSession = session || this.currentSession;
    if (!targetSession) return;

    const ref = this.dialogService.open(CashReconciliationDialogComponent, {
      header: 'Usklađivanje cash-a',
      width: '700px',
      data: { session: targetSession }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result) {
          this.loadDashboardData();
        }
      });
    }
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  /**
   * Formatira iznos za prikaz
   */
  formatAmount(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0 RSD';
    return `${amount.toFixed(2)} RSD`;
  }


  /**
   * Vraća boju za status sesije (za backward compatibility)
   * @deprecated Koristi getStatusSeverity umesto toga
   */
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'open': return 'primary';
      case 'closed': return 'accent';
      default: return 'warn';
    }
  }

  /**
   * Vraća severity za status sesije (PrimeNG)
   */
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'open': return 'success';
      case 'closed': return 'info';
      default: return 'warning';
    }
  }

  /**
   * Vraća tekst za status sesije
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'open': return 'Otvorena';
      case 'closed': return 'Zatvorena';
      default: return 'Nepoznato';
    }
  }

  /**
   * Vraća boju za variance
   */
  getVarianceColor(variance: number): 'primary' | 'accent' | 'warn' {
    const absVariance = Math.abs(variance);
    if (absVariance <= 100) return 'primary';
    if (absVariance <= 500) return 'accent';
    return 'warn';
  }

  /**
   * Get variance icon (PrimeIcons)
   * @param variance - Variance amount
   * @returns Icon class name
   */
  getVarianceIcon(variance: number): string {
    if (variance > 0) return 'pi-arrow-up';
    if (variance < 0) return 'pi-arrow-down';
    return 'pi-minus';
  }

  /**
   * Get variance severity (PrimeNG)
   * @param variance - Variance amount
   * @returns Severity
   */
  getVarianceSeverity(variance: number): 'success' | 'info' | 'warning' | 'danger' {
    const absVariance = Math.abs(variance);
    if (absVariance <= 100) return 'success';
    if (absVariance <= 500) return 'warning';
    return 'danger';
  }

  /**
   * Show error message to user
   * @param message - Error message
   */
  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Greška',
      detail: message
    });
  }

  /**
   * Show success message to user
   * @param message - Success message
   */
  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Uspeh',
      detail: message
    });
  }

  /**
   * Format currency amount
   * @param amount - Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Check if session has significant variance
   * @param variance - Variance amount
   * @returns True if variance is significant
   */
  hasSignificantVariance(variance: number): boolean {
    return Math.abs(variance) > 100; // More than 100 RSD
  }
}