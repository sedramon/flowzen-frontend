import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PosService } from '../../../services/pos.service';
import { DailyCashReport } from '../../../../../models/CashSession';
import { Facility } from '../../../../../models/Facility';

@Component({
  selector: 'app-cash-reports',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    FloatLabelModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    PaginatorModule,
    TooltipModule,
    ToastModule,
    ReactiveFormsModule
  ],
  providers: [MessageService],
  templateUrl: './cash-reports.component.html',
  styleUrls: ['./cash-reports.component.scss']
})
export class CashReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  dailyReports: DailyCashReport[] = [];
  facilities: Facility[] = [];
  facilityOptions: { label: string; value: string }[] = [];
  
  // Loading states
  loading = true;
  reportLoading = false;
  
  // Form
  reportForm: FormGroup;

  // Cache for total stats to avoid repeated calculations
  private _cachedTotalStats: any = null;
  private _lastReportsHash: string = '';

  constructor(
    private posService: PosService,
    private messageService: MessageService,
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
          this.facilityOptions = [
            { label: 'Sve lokacije', value: '' },
            ...facilities.map(f => ({ label: f.name, value: f._id || '' }))
          ];
          this.loadReports().then(reports => {
            this.dailyReports = reports;
            this.loading = false;
            
            // Invalidate cache when data changes
            this._cachedTotalStats = null;
            this._lastReportsHash = '';
          }).catch(error => {
            console.error('Error loading reports:', error);
            this.messageService.add({ severity: 'error', summary: 'Greška', detail: 'Greška pri učitavanju izveštaja', life: 3000 });
            this.loading = false;
          });
        },
        error: (error) => {
          console.error('Error loading facilities:', error);
          this.messageService.add({ severity: 'error', summary: 'Greška', detail: 'Greška pri učitavanju objekata', life: 3000 });
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
      
      this.messageService.add({ severity: 'success', summary: 'Uspešno', detail: 'Izveštaj uspešno generisan', life: 2000 });
    }).catch(error => {
      console.error('Error generating report:', error);
      this.messageService.add({ severity: 'error', summary: 'Greška', detail: 'Greška pri generisanju izveštaja', life: 3000 });
      this.reportLoading = false;
    });
  }

  /**
   * Eksportuje izveštaj
   */
  exportReport(): void {
    if (this.dailyReports.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Upozorenje', detail: 'Nema podataka za eksport', life: 3000 });
      return;
    }

    // TODO: Implement export functionality
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Eksport funkcionalnost će biti implementirana', life: 2000 });
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
   * Vraća boju za variance (PrimeNG severity)
   */
  getVarianceColor(variance: number): 'success' | 'info' | 'warn' | 'danger' {
    const absVariance = Math.abs(variance);
    if (absVariance <= 100) return 'success';
    if (absVariance <= 500) return 'info';
    return 'warn';
  }

  /**
   * Vraća ikonu za variance (PrimeIcons)
   */
  getVarianceIcon(variance: number): string {
    if (variance > 0) return 'pi-arrow-up-right';
    if (variance < 0) return 'pi-arrow-down-left';
    return 'pi-minus';
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
