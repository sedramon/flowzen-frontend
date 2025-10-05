import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PosService } from '../../../services/pos.service';
import { DailyCashReport } from '../../../../../models/CashSession';
import { Facility } from '../../../../../models/Facility';

@Component({
  selector: 'app-cash-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ReactiveFormsModule
  ],
  templateUrl: './cash-reports.component.html',
  styleUrls: ['./cash-reports.component.scss']
})
export class CashReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  dailyReports: DailyCashReport[] = [];
  facilities: Facility[] = [];
  
  // Loading states
  loading = true;
  reportLoading = false;
  
  // Form
  reportForm: FormGroup;
  
  // Table data
  displayedColumns: string[] = [
    'date', 
    'facility', 
    'sessionCount', 
    'totalOpeningFloat', 
    'totalExpectedCash', 
    'totalActualCash', 
    'totalVariance', 
    'variancePercentage',
    'actions'
  ];

  // Cache for total stats to avoid repeated calculations
  private _cachedTotalStats: any = null;
  private _lastReportsHash: string = '';

  constructor(
    private posService: PosService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.reportForm = this.fb.group({
      facility: [''],
      startDate: [new Date()],
      endDate: [new Date()]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Učitava početne podatke
   */
  private loadInitialData(): void {
    this.loading = true;
    
    this.posService.getFacilities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities) => {
          this.facilities = facilities;
          this.loadReports().then(reports => {
            this.dailyReports = reports;
            this.loading = false;
            
            // Invalidate cache when data changes
            this._cachedTotalStats = null;
            this._lastReportsHash = '';
          }).catch(error => {
            console.error('Error loading reports:', error);
            this.snackBar.open('Greška pri učitavanju izveštaja', 'Zatvori', { duration: 3000 });
            this.loading = false;
          });
        },
        error: (error) => {
          console.error('Error loading facilities:', error);
          this.snackBar.open('Greška pri učitavanju objekata', 'Zatvori', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  /**
   * Učitava izveštaje na osnovu form parametara
   */
  private loadReports(): Promise<DailyCashReport[]> {
    return new Promise((resolve, reject) => {
      const formValue = this.reportForm.value;
      const startDate = formValue.startDate ? formValue.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const endDate = formValue.endDate ? formValue.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      if (formValue.facility) {
        this.posService.getDailyCashReport(formValue.facility, startDate).subscribe({
          next: (report) => resolve([report]),
          error: reject
        });
      } else {
        // Load reports for all facilities
        const facilityPromises = this.facilities.map(facility => 
          this.posService.getDailyCashReport(facility._id || '', startDate).toPromise()
        );
        
        Promise.all(facilityPromises).then(reports => {
          const filteredReports = reports.filter((report): report is DailyCashReport => report !== null && report !== undefined);
          resolve(filteredReports);
        }).catch(reject);
      }
    });
  }

  /**
   * Generiše izveštaj
   */
  generateReport(): void {
    this.reportLoading = true;
    
    this.loadReports().then(reports => {
      this.dailyReports = reports;
      this.reportLoading = false;
      
      // Invalidate cache when data changes
      this._cachedTotalStats = null;
      this._lastReportsHash = '';
      
      this.snackBar.open('Izveštaj uspešno generisan', 'Zatvori', { duration: 2000 });
    }).catch(error => {
      console.error('Error generating report:', error);
      this.snackBar.open('Greška pri generisanju izveštaja', 'Zatvori', { duration: 3000 });
      this.reportLoading = false;
    });
  }

  /**
   * Eksportuje izveštaj
   */
  exportReport(): void {
    if (this.dailyReports.length === 0) {
      this.snackBar.open('Nema podataka za eksport', 'Zatvori', { duration: 3000 });
      return;
    }

    // TODO: Implement export functionality
    this.snackBar.open('Eksport funkcionalnost će biti implementirana', 'Zatvori', { duration: 2000 });
  }

  /**
   * Formatira datum za prikaz
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatira iznos za prikaz
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

  /**
   * Vraća ukupne statistike (sa cache-om)
   */
  getTotalStats(): {
    totalSessions: number;
    totalOpeningFloat: number;
    totalExpectedCash: number;
    totalActualCash: number;
    totalVariance: number;
    averageVariance: number;
  } {
    // Generate hash of current reports to check if cache is valid
    const currentHash = JSON.stringify(this.dailyReports.map(r => ({ 
      sessionCount: r.sessionCount, 
      summary: r.summary 
    })));
    
    // Return cached stats if reports haven't changed
    if (this._cachedTotalStats && this._lastReportsHash === currentHash) {
      return this._cachedTotalStats;
    }
    
    const stats = this.dailyReports.reduce((totals, report) => {
      return {
        totalSessions: totals.totalSessions + (report.sessionCount || 0),
        totalOpeningFloat: totals.totalOpeningFloat + (report.summary?.totalOpeningFloat || 0),
        totalExpectedCash: totals.totalExpectedCash + (report.summary?.totalExpectedCash || 0),
        totalActualCash: totals.totalActualCash + (report.summary?.totalActualCash || 0),
        totalVariance: totals.totalVariance + (report.summary?.totalVariance || 0),
        averageVariance: 0 // Will be calculated below
      };
    }, {
      totalSessions: 0,
      totalOpeningFloat: 0,
      totalExpectedCash: 0,
      totalActualCash: 0,
      totalVariance: 0,
      averageVariance: 0
    });
    
    // Calculate average variance
    if (stats.totalSessions > 0) {
      stats.averageVariance = stats.totalVariance / stats.totalSessions;
    }
    
    // Cache the results
    this._cachedTotalStats = stats;
    this._lastReportsHash = currentHash;
    
    return stats;
  }
}
