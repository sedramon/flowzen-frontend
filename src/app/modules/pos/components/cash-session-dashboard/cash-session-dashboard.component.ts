import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Service imports
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';

// Model imports
import { CashSession } from '../../../../models/CashSession';
import { Facility } from '../../../../models/Facility';

// Dialog imports
import { OpenSessionDialogComponent } from '../open-session-dialog/open-session-dialog.component';
import { CloseSessionDialogComponent } from '../close-session-dialog/close-session-dialog.component';
import { CashCountingDialogComponent } from '../cash-counting-dialog/cash-counting-dialog.component';
import { CashReconciliationDialogComponent } from '../cash-reconciliation-dialog/cash-reconciliation-dialog.component';

/**
 * Cash Session Dashboard Component
 * 
 * Glavna komponenta za upravljanje cash sesijama u POS sistemu.
 * Omogućava otvaranje/zatvaranje sesija, brojanje cash-a i usklađivanje.
 */
@Component({
  selector: 'app-cash-session-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cash-session-dashboard.component.html',
  styleUrls: ['./cash-session-dashboard.component.scss']
})
export class CashSessionDashboardComponent implements OnInit, OnDestroy {
  
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  
  private destroy$ = new Subject<void>();
  
  // Data
  currentSession: CashSession | null = null;
  recentSessions: CashSession[] = [];
  facilities: Facility[] = [];
  
  // Loading states
  loading = true;
  sessionLoading = false;
  
  // Statistics
  todayStats = {
    totalSessions: 0,
    totalCash: 0,
    totalVariance: 0,
    averageVariance: 0
  };

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private posService: PosService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
   * Učitava sve potrebne podatke za dashboard
   */
  private loadDashboardData(): void {
    this.loading = true;
    
    const currentUser = this.authService.getCurrentUser();
    forkJoin({
      facilities: this.posService.getFacilities(currentUser?.tenant),
      todayStats: this.posService.getTodayCashStats()
    })
    .pipe(
      map(({ facilities, todayStats }) => {
        const facilityId = facilities.length > 0 ? facilities[0]._id : '68d855f9f07f767dc2582ba2';
        return forkJoin({
          currentSession: this.posService.getCurrentSession(facilities),
          recentSessions: this.posService.getRecentSessions(10, facilities),
          facilities: of(facilities),
          todayStats: this.posService.getTodayCashStats(facilityId)
        });
      }),
      switchMap(result => result)
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.currentSession = data.currentSession;
        this.recentSessions = data.recentSessions;
        this.facilities = data.facilities;
        this.todayStats = data.todayStats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.snackBar.open('Greška pri učitavanju podataka', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Otvara dialog za otvaranje nove sesije
   */
  openNewSession(): void {
    const dialogRef = this.dialog.open(OpenSessionDialogComponent, {
      width: '500px',
      data: { facilities: this.facilities }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
        this.snackBar.open('Sesija uspešno otvorena', 'Zatvori', { duration: 2000 });
      }
    });
  }

  /**
   * Zatvara trenutnu aktivnu sesiju
   */
  closeCurrentSession(): void {
    if (!this.currentSession) return;
    
    const dialogRef = this.dialog.open(CloseSessionDialogComponent, {
      width: '600px',
      data: { session: this.currentSession }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
        this.snackBar.open('Sesija uspešno zatvorena', 'Zatvori', { duration: 2000 });
      }
    });
  }

  // ============================================================================
  // CASH OPERATIONS
  // ============================================================================

  /**
   * Otvara dialog za brojanje cash-a
   */
  countCash(): void {
    if (!this.currentSession) return;

    const dialogRef = this.dialog.open(CashCountingDialogComponent, {
      width: '500px',
      data: { session: this.currentSession }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
      }
    });
  }

  /**
   * Otvara dialog za usklađivanje cash-a
   */
  reconcileCash(session?: CashSession): void {
    const targetSession = session || this.currentSession;
    if (!targetSession) return;

    const dialogRef = this.dialog.open(CashReconciliationDialogComponent, {
      width: '700px',
      data: { session: targetSession }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
      }
    });
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  /**
   * Formatira iznos za prikaz
   */
  formatAmount(amount: number): string {
    return `${amount.toFixed(2)} RSD`;
  }

  /**
   * Formatira datum za prikaz
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Vraća boju za status sesije
   */
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'open': return 'primary';
      case 'closed': return 'accent';
      default: return 'warn';
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
   * Vraća ikonu za variance
   */
  getVarianceIcon(variance: number): string {
    if (variance > 0) return 'trending_up';
    if (variance < 0) return 'trending_down';
    return 'trending_flat';
  }
}