import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PosService } from '../../../services/pos.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Facility } from '../../../../../models/Facility';

interface ReportData {
  date: string;
  facility: string;
  employee: string;
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  salesCount: number;
  refundCount: number;
  paymentTotals: Record<string, number>;
}

interface DailyReport {
  date: string;
  facility: string;
  salesCount: number;
  refundCount: number;
  totalSales: number;
  totalRefunds: number;
  paymentTotals: Record<string, number>;
}

interface ZReport {
  sessionId: string;
  openedAt: string;
  closedAt: string;
  cashier: string;
  salesCount: number;
  refundCount: number;
  totalSales: number;
  totalRefunds: number;
  paymentTotals: Record<string, number>;
  openingFloat: number;
  closingCount: number;
  expectedCash: number;
  variance: number;
}

@Component({
  selector: 'app-pos-reports',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    FloatLabelModule,
    SelectModule,
    TooltipModule,
    DatePickerModule,
    InputTextModule,
    ProgressSpinnerModule,
    TabsModule,
    TagModule,
    ToastModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './pos-reports.component.html',
  styleUrl: './pos-reports.component.scss',
  providers: [AuthService, PosService, MessageService, DialogService]
})
export class PosReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  reportData: ReportData[] = [];
  dailyReports: DailyReport[] = [];
  zReports: ZReport[] = [];
  facilities: Facility[] = [];
  
  // Loading states
  loading = false;
  reportsLoading = false;
  zReportsLoading = false;
  todayReportLoading = false;
  
  // Display columns
  displayedColumns: string[] = ['date', 'facility', 'salesCount', 'totalSales', 'totalRefunds', 'netAmount', 'actions'];
  zReportColumns: string[] = ['sessionId', 'cashier', 'openedAt', 'closedAt', 'totalSales', 'variance'];
  
  // Filters
  dateFrom = new FormControl<Date | null>(null);
  dateTo = new FormControl<Date | null>(null);
  facilityFilter = new FormControl<string>('');
  selectedTab = '0';
  
  // Options for selects
  facilityOptions: Array<{label: string, value: string}> = [];

  constructor(
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService,
    private messageService: MessageService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadFacilities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setDefaultDates(): void {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    this.dateFrom.setValue(weekAgo);
    this.dateTo.setValue(today);
  }

  loadFacilities(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }

    this.loading = true;
    this.posService.getFacilities(currentUser.tenant ?? this.authService.getCurrentTenantId() ?? undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (facilities) => {
          this.facilities = facilities;
          // Build facility options for p-select
          this.facilityOptions = [
            { label: 'Svi objekti', value: '' },
            ...facilities.map(f => ({ label: f.name, value: f._id || '' }))
          ];
          if (facilities.length > 0) {
            this.facilityFilter.setValue(facilities[0]._id || '');
            this.loadReports();
            this.loadTodaysReport();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading facilities:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Greška',
            detail: 'Greška pri učitavanju objekata'
          });
          this.loading = false;
        }
      });
  }

  loadReports(): void {
    if (!this.facilityFilter.value) {
      return;
    }

    this.reportsLoading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      return;
    }

    const startDate = this.dateFrom.value?.toISOString().split('T')[0];
    const endDate = this.dateTo.value?.toISOString().split('T')[0];

    // Load daily reports for each day in range
    if (startDate && endDate) {
      this.loadDailyReportsRange(startDate, endDate);
    }
  }

  loadTodaysReport(): void {
    if (!this.facilityFilter.value) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    this.todayReportLoading = true;
    
    this.posService.getDailyReport({
      facility: this.facilityFilter.value || undefined,
      date: today
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Today's report comes directly as data (already extracted by PosService)
          if (response && response.date) {
            // Dodaj današnji izveštaj na vrh liste
            const todayReport = {
              date: response.date,
              facility: this.getFacilityName(response.facility),
              salesCount: response.summary?.transactionCount || 0,
              refundCount: response.summary?.refundCount || 0,
              totalSales: response.summary?.totalSales || 0,
              totalRefunds: response.summary?.totalRefunds || 0,
              paymentTotals: response.paymentTotals || {}
            };
            
            // Proveri da li već postoji današnji izveštaj
            const existingIndex = this.dailyReports.findIndex(report => report.date === today);
            if (existingIndex >= 0) {
              this.dailyReports[existingIndex] = todayReport;
            } else {
              this.dailyReports.unshift(todayReport);
            }
          }
          this.todayReportLoading = false;
        },
        error: (error) => {
          console.error('Error loading today\'s report:', error);
          this.todayReportLoading = false;
        }
      });
  }

  loadDailyReportsRange(startDate: string, endDate: string): void {
    const requests: any[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      requests.push(this.posService.getDailyReport({
        facility: this.facilityFilter.value || undefined,
        date: dateStr
      }));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: any[]) => {
          // Handle backend response format: {success: true, data: {...}, message: '...'}
          this.dailyReports = responses
            .filter(response => response && response.success && response.data)
            .map(response => {
              const data = response.data;
              
              return {
                date: data.date,
                facility: this.getFacilityName(data.facility),
                salesCount: data.summary?.transactionCount || 0,
                refundCount: data.summary?.refundCount || 0,
                totalSales: data.summary?.totalSales || 0,
                totalRefunds: data.summary?.totalRefunds || 0,
                paymentTotals: data.paymentTotals || {}
              };
            });
          
          this.reportsLoading = false;
        },
        error: (error) => {
          console.error('Error loading daily reports:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Greška',
            detail: 'Greška pri učitavanju dnevnih izveštaja'
          });
          this.reportsLoading = false;
        }
      });
  }

  loadZReports(): void {
    this.zReportsLoading = true;
    
    // Load recent sessions and generate Z reports for closed ones
    this.posService.getSessions({ 
      status: 'closed',
      facility: this.facilityFilter.value || undefined
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions: any) => {
          // Handle backend response format: {success: true, data: [...], message: '...'}
          let sessionsArray = sessions;
          if (!Array.isArray(sessions) && sessions?.success && Array.isArray(sessions.data)) {
            sessionsArray = sessions.data;
          }
          
          if (!Array.isArray(sessionsArray)) {
            console.error('Sessions is not an array!', sessions);
            return;
          }
          
          const zReportRequests = sessionsArray.map(session => 
            this.posService.getZReport(session.id || session._id)
          );
          
          forkJoin(zReportRequests)
            .subscribe({
              next: (zReports: any[]) => {
                this.zReports = zReports.map(report => ({
                  sessionId: report.sessionId,
                  openedAt: report.openedAt,
                  closedAt: report.closedAt,
                  cashier: report.cashier?.name || 'N/A',
                  salesCount: report.salesCount,
                  refundCount: report.refundCount,
                  totalSales: report.totalSales,
                  totalRefunds: report.totalRefunds,
                  paymentTotals: report.paymentTotals || {},
                  openingFloat: report.openingFloat,
                  closingCount: report.closingCount,
                  expectedCash: report.expectedCash,
                  variance: report.variance
                }));
                this.zReportsLoading = false;
              },
              error: (error) => {
                console.error('Error loading Z reports:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Greška',
                  detail: 'Greška pri učitavanju Z izveštaja'
                });
                this.zReportsLoading = false;
              }
            });
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Greška',
            detail: 'Greška pri učitavanju sesija'
          });
          this.zReportsLoading = false;
        }
      });
  }

  onTabChange(value: string): void {
    this.selectedTab = value;
    if (value === '1' && this.zReports.length === 0) {
      this.loadZReports();
    }
  }

  onFilterChange(): void {
    if (this.selectedTab === '0') {
      this.loadReports();
      this.loadTodaysReport();
    } else if (this.selectedTab === '1') {
      this.loadZReports();
    }
  }

  exportToExcel(): void {
    const dataToExport = this.selectedTab === '0' ? this.dailyReports : this.zReports;
    
    if (dataToExport.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Upozorenje',
        detail: 'Nema podataka za izvoz'
      });
      return;
    }

    // Kreiraj CSV sadržaj
    const csvContent = this.generateCSV(dataToExport);
    
    // Kreiraj i preuzmi fajl
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pos_reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Uspeh',
        detail: 'Izveštaj uspešno izvezen'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Greška',
        detail: 'Greška pri izvozu - pregledač ne podržava preuzimanje'
      });
    }
  }

  viewReportDetails(report: any): void {
    // TODO: Napravi ReportDetailsDialogComponent
    console.log('Report details:', report);
    this.messageService.add({
      severity: 'info',
      summary: 'Detalji',
      detail: `Prikaz detalja za ${report.date} - ${report.facility}`
    });
    
    // Privremeno - otvori dialog sa detaljima izveštaja
    // const dialogRef = this.dialog.open(ReportDetailsDialogComponent, {
    //   width: '800px',
    //   data: { report, type: 'daily' }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     // Možda neki dodatni action
    //   }
    // });
  }

  generateCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    // Odredi kolone na osnovu tipa podataka
    const isDailyReport = this.selectedTab === '0';
    const headers = isDailyReport 
      ? ['Datum', 'Objekat', 'Broj prodaja', 'Ukupan promet', 'Povraćaji', 'Neto promet']
      : ['ID Sesije', 'Blagajnik', 'Otvorio', 'Zatvorio', 'Ukupan promet', 'Varijacija'];
    
    // Kreiraj CSV sadržaj
    const csvRows = [headers.join(',')];
    
    data.forEach(item => {
      const row = isDailyReport 
        ? [
            item.date,
            `"${item.facility}"`,
            item.salesCount,
            item.totalSales,
            item.totalRefunds,
            (item.totalSales - item.totalRefunds)
          ]
        : [
            item.sessionId,
            `"${item.cashier}"`,
            item.openedAt,
            item.closedAt,
            item.totalSales,
            item.variance
          ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  getFacilityName(facilityId: string): string {
    const facility = this.facilities.find(f => f._id === facilityId);
    return facility?.name || 'N/A';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sr-RS');
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('sr-RS');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getPaymentMethodText(method: string): string {
    const methods: Record<string, string> = {
      cash: 'Gotovina',
      card: 'Kartica',
      voucher: 'Vaučer',
      gift: 'Poklon bon',
      bank: 'Bankovni transfer',
      other: 'Ostalo'
    };
    return methods[method] || method;
  }

  getPaymentMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      cash: 'attach_money',
      card: 'credit_card',
      voucher: 'confirmation_number',
      gift: 'card_giftcard',
      bank: 'account_balance',
      other: 'payment'
    };
    return icons[method] || 'payment';
  }

  // ============================================================================
  // CALCULATION METHODS
  // ============================================================================

  getTotalSales(): number {
    return this.dailyReports.reduce((sum, item) => sum + item.totalSales, 0);
  }

  getTotalRefunds(): number {
    return this.dailyReports.reduce((sum, item) => sum + item.totalRefunds, 0);
  }

  getNetAmount(): number {
    return this.getTotalSales() - this.getTotalRefunds();
  }

  getTotalTransactions(): number {
    return this.dailyReports.reduce((sum, item) => sum + item.salesCount, 0);
  }

  getAverageTransactionValue(): number {
    const totalSales = this.getTotalSales();
    const totalTransactions = this.getTotalTransactions();
    return totalTransactions > 0 ? totalSales / totalTransactions : 0;
  }

  // Z Report calculations
  getZTotalSales(): number {
    return this.zReports.reduce((sum, item) => sum + item.totalSales, 0);
  }

  getZTotalVariance(): number {
    return this.zReports.reduce((sum, item) => sum + item.variance, 0);
  }

  getZAverageVariance(): number {
    return this.zReports.length > 0 ? this.getZTotalVariance() / this.zReports.length : 0;
  }
}
