import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { forkJoin, of, Subject } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';

// Component imports
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosReceiptComponent } from '../pos-receipt/pos-receipt.component';
import { PosRefundComponent } from '../pos-refund/pos-refund.component';
import { PosTransactionViewComponent } from '../pos-transaction-view/pos-transaction-view.component';

// Service imports
import { PosService } from '../../../services/pos.service';
import { AuthService } from '../../../../../core/services/auth.service';

// Model imports
import { Client } from '../../../../../models/Client';
import { Facility } from '../../../../../models/Facility';
import { Service } from '../../../../../models/Service';
import { Article } from '../../../../../models/Article';
import { Sale, FiscalResponse } from '../../../../../models/Sale';

/**
 * Sales Statistics Interface
 */
interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
  todayRevenue: number;
}

/**
 * POS Sales Component
 * 
 * Glavna komponenta za upravljanje prodajama u POS sistemu.
 * Omogućava kreiranje novih prodaja, pregled postojećih, fiskalizaciju i povraćaje.
 * 
 * Funkcionalnosti:
 * - Prikaz svih prodaja sa filterima
 * - Kreiranje novih prodaja
 * - Fiskalizacija prodaja
 * - Povraćaj prodaja
 * - Statistike prodaje
 * - Export računa
 */
@Component({
  selector: 'app-pos-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    FloatLabelModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [AuthService, PosService, DialogService, MessageService],
  templateUrl: './pos-sales.component.html',
  styleUrl: './pos-sales.component.scss'
})
export class PosSalesComponent implements OnInit, OnDestroy {
  
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  
  loading = false;
  currentFacility: Facility | null = null;
  selectedFacilityId: string | null = null;
  private destroy$ = new Subject<void>();
  
  // Data arrays
  clients: Client[] = [];
  facilities: Facility[] = [];
  services: Service[] = [];
  articles: Article[] = [];
  sales: Sale[] = [];
  
  // Table configuration for PrimeNG
  salesColumns: any[] = [
    { field: 'number', header: 'Broj računa' },
    { field: 'date', header: 'Datum' },
    { field: 'client', header: 'Klijent' },
    { field: 'facility', header: 'Objekat' },
    { field: 'cashier', header: 'Blagajnik' },
    { field: 'status', header: 'Status' },
    { field: 'total', header: 'Ukupno' },
    { field: 'fiscal', header: 'Fiskalizacija' },
    { field: 'actions', header: 'Akcije' }
  ];
  
  facilityOptions: any[] = [];
  
  // Statistics
  statistics: SalesStatistics = {
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    todayRevenue: 0
  };

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private readonly dialogService: DialogService,
    private readonly messageService: MessageService,
    private readonly posService: PosService,
    @Inject(AuthService) private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize component - load all required data
   */
  private initializeComponent(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.showError('Korisnik nije prijavljen');
      this.loading = false;
      return;
    }

    this.loadAllData(this.authService.requireCurrentTenantId());
  }

  /**
   * Load all required data in parallel
   * @param tenant - Tenant ID
   */
  private loadAllData(tenant: string): void {
    forkJoin({
      facilities: this.posService.getFacilities(tenant).pipe(
        catchError(error => this.handleDataLoadError('facilities', error))
      ),
      clients: this.posService.getClients(tenant).pipe(
        catchError(error => this.handleDataLoadError('clients', error))
      ),
      services: this.posService.getServices(tenant).pipe(
        catchError(error => this.handleDataLoadError('services', error))
      ),
      articles: this.posService.getArticles(tenant).pipe(
        catchError(error => this.handleDataLoadError('articles', error))
      )
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => this.handleDataLoadSuccess(data),
      error: (error) => this.handleDataLoadError('general', error)
    });
  }

  /**
   * Handle successful data loading
   * @param data - Loaded data
   */
  private handleDataLoadSuccess(data: any): void {
    this.facilities = data.facilities || [];
    this.clients = data.clients || [];
    this.services = data.services || [];
    this.articles = data.articles || [];
    
    // Prepare facility options for PrimeNG select
    this.facilityOptions = this.facilities.map((f: Facility) => ({
      label: f.name,
      value: f._id
    }));
    
    console.log('=== POS SALES COMPONENT INITIALIZATION ===');
    console.log('Facilities loaded:', this.facilities.length, this.facilities);
    console.log('Clients loaded:', this.clients.length, this.clients);
    console.log('Services loaded:', this.services.length, this.services);
    console.log('Articles loaded:', this.articles.length, this.articles);
    
    if (this.facilities.length > 0) {
      this.currentFacility = this.facilities[0];
      this.selectedFacilityId = this.currentFacility._id;
      console.log('Current facility set:', this.currentFacility);
      this.loadSales();
    } else {
      console.error('No facilities available');
      this.showError('Nema dostupnih objekata');
      this.loading = false;
    }
  }

  /**
   * Handle data loading error
   * @param dataType - Type of data that failed to load
   * @param error - Error object
   * @returns Empty array for forkJoin
   */
  private handleDataLoadError(dataType: string, error: any): any {
    console.error(`Error loading ${dataType}:`, error);
    
    if (dataType === 'general') {
      this.showError('Greška pri učitavanju podataka');
      this.loading = false;
    }
    
    return of([]);
  }

  // ============================================================================
  // SALES DATA MANAGEMENT
  // ============================================================================

  /**
   * Load sales for current facility
   */
  loadSales(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!this.validateSalesLoad(currentUser)) {
      return;
    }

    if (!this.loading) {
      this.loading = true;
    }

    const params = this.buildSalesParams(this.authService.requireCurrentTenantId());
    console.log('Loading sales with params:', params);
    
    this.posService.getSales(params)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (sales: Sale[]) => {
          console.log('Sales loaded from API:', sales.length, sales);
          console.log('First sale cashier:', sales[0]?.cashier);
          this.handleSalesLoadSuccess(sales);
        },
        error: (error) => {
          console.error('Error loading sales:', error);
          this.handleSalesLoadError(error);
        }
      });
  }

  /**
   * Validate prerequisites for loading sales
   * @param currentUser - Current authenticated user
   * @returns True if validation passes
   */
  private validateSalesLoad(currentUser: any): boolean {
    if (!currentUser) {
      console.warn('Cannot load sales: user not authenticated');
      return false;
    }

    if (!this.currentFacility) {
      console.warn('Cannot load sales: no facility selected');
      return false;
    }

    return true;
  }

  /**
   * Build query parameters for sales request
   * @param tenant - Tenant ID
   * @returns Query parameters
   */
  private buildSalesParams(tenant: string): any {
    return {
      tenant,
      facility: this.currentFacility!._id,
      limit: 50,
      sort: '-createdAt'
    };
  }

  /**
   * Process sales response from backend
   * @param response - Backend response
   * @returns Processed sales array
   */
  private processSalesResponse(response: any): Sale[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    if (response && response.sales && Array.isArray(response.sales)) {
      return response.sales;
    }
    return [];
  }

  /**
   * Handle successful sales loading
   * @param sales - Loaded sales array
   */
  private handleSalesLoadSuccess(sales: Sale[]): void {
    this.sales = sales || [];
    console.log('=== SALES LOADED SUCCESSFULLY ===');
    console.log('Sales count:', this.sales.length);
    console.log('Sales data:', this.sales);
    
    this.calculateStatistics();
    console.log('=== STATISTICS CALCULATED ===');
    console.log('Statistics:', this.statistics);
    
    this.loading = false;
  }

  /**
   * Handle sales loading error
   * @param error - Error object
   * @returns Empty sales array
   */
  private handleSalesLoadError(error: any): any {
    console.error('Error loading sales:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Greška',
      detail: 'Greška pri učitavanju prodaja'
    });
    this.loading = false;
    return of(this.sales);
  }

  /**
   * Calculate sales statistics
   */
  private calculateStatistics(): void {
    console.log('=== CALCULATING STATISTICS ===');
    console.log('Input sales:', this.sales);
    
    const totalSales = this.sales.length;
    const totalRevenue = this.calculateTotalRevenue();
    const averageSale = this.calculateAverageSale();
    const todayRevenue = this.calculateTodayRevenue();
    
    console.log('Calculated values:');
    console.log('- Total sales count:', totalSales);
    console.log('- Total revenue:', totalRevenue);
    console.log('- Average sale:', averageSale);
    console.log('- Today revenue:', todayRevenue);
    
    this.statistics = {
      totalSales,
      totalRevenue,
      averageSale,
      todayRevenue
    };
  }

  /**
   * Calculate total revenue from all sales
   * @returns Total revenue
   */
  private calculateTotalRevenue(): number {
    const revenue = this.sales.reduce((sum, sale) => {
      const saleTotal = sale.summary?.grandTotal || 0;
      return sum + saleTotal;
    }, 0);
    
    console.log('Total revenue calculated:', revenue);
    return revenue;
  }

  /**
   * Calculate average sale amount
   * @returns Average sale amount
   */
  private calculateAverageSale(): number {
    const totalRevenue = this.calculateTotalRevenue();
    const salesCount = this.sales.length;
    const average = salesCount > 0 ? totalRevenue / salesCount : 0;
    
    console.log(`Average calculation: ${totalRevenue} / ${salesCount} = ${average}`);
    return average;
  }

  /**
   * Calculate today's revenue
   * @returns Today's revenue
   */
  private calculateTodayRevenue(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('Today date filter:', today.toISOString());
    
    const todaySales = this.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const isToday = saleDate >= today;
      return isToday;
    });
    
    console.log('Today sales count:', todaySales.length);
    
    const todayRevenue = todaySales.reduce((sum, sale) => {
      const saleTotal = sale.summary?.grandTotal || 0;
      console.log(`Today sale ${sale.number || sale.id}: grandTotal = ${saleTotal}`);
      return sum + saleTotal;
    }, 0);
    
    console.log('Today revenue calculated:', todayRevenue);
    return todayRevenue;
  }

  // ============================================================================
  // FACILITY MANAGEMENT
  // ============================================================================

  /**
   * Menja trenutni facility i učitava prodaje za novi facility
   */
  onFacilityChange(facilityId: string): void {
    this.selectedFacilityId = facilityId;
    this.currentFacility = this.facilities.find(f => f._id === facilityId) || null;
    if (this.currentFacility) {
      this.loadSales();
    }
  }

  // ============================================================================
  // DIALOG ACTIONS
  // ============================================================================

  /**
   * Otvara dialog za kreiranje nove prodaje
   */
  openNewSale(): void {
    if (!this.currentFacility) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Upozorenje',
        detail: 'Izaberite objekat pre kreiranja prodaje'
      });
      return;
    }

    const ref = this.dialogService.open(PosCheckoutComponent, {
      header: 'Nova prodaja',
      width: '800px',
      styleClass: 'custom-appointment-dialog',
      data: {
        facility: this.currentFacility,
        clients: this.clients,
        services: this.services,
        articles: this.articles,
        total: 0,
        appointment: null,
        tenant: this.authService.getCurrentTenantId() ?? undefined
      }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result && result.id) {
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Prodaja uspešno kreirana!'
          });
          this.loadSales();
        }
      });
    }
  }

  /**
   * Otvara dialog za pregled detalja prodaje
   */
  viewSale(sale: any): void {
    this.dialogService.open(PosTransactionViewComponent, {
      header: 'Pregled transakcije',
      width: '800px',
      styleClass: 'pos-transaction-view-dialog',
      data: { transaction: sale }
    });
  }

  /**
   * Otvara dialog za štampanje računa
   */
  printReceipt(sale: any): void {
    this.dialogService.open(PosReceiptComponent, {
      header: 'Štampanje računa',
      width: '600px',
      styleClass: 'pos-receipt-dialog',
      data: { saleId: sale._id || sale.id }
    });
  }

  /**
   * Otvara dialog za povraćaj prodaje
   */
  refundSale(sale: any): void {
    const ref = this.dialogService.open(PosRefundComponent, {
      header: 'Povraćaj prodaje',
      width: '900px',
      styleClass: 'pos-refund-dialog',
      data: { sale: sale }
    });

    if (ref) {
      ref.onClose.subscribe((result) => {
        if (result) {
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Povraćaj uspešno obrađen'
          });
          this.loadSales();
        }
      });
    }
  }

  // ============================================================================
  // FISCALIZATION
  // ============================================================================

  /**
   * Pokreće fiskalizaciju prodaje
   */
  fiscalizeSale(sale: any): void {
    if (!this.currentFacility) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Upozorenje',
        detail: 'Izaberite objekat pre fiskalizacije'
      });
      return;
    }

    if (!sale || !sale._id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Greška',
        detail: 'Nije moguće fiskalizovati prodaju'
      });
      return;
    }

    const saleId = sale._id || sale.id;
    
    // Ako je već fiskalizovana, prikaži poruku
    if (sale.fiscal?.status === 'success') {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Račun je već fiskalizovan'
      });
      return;
    }

    // UVIJEK resetuj pre fiskalizacije za sigurnost
    this.resetFiscalizationAndRetry(saleId);
  }

  private resetFiscalizationAndRetry(saleId: string, retryCount: number = 0): void {
    const maxRetries = 1; // Samo jedan retry
    
    if (retryCount === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Resetovanje fiskalizacije...'
      });
    }
    
    this.posService.resetFiscalization(saleId).subscribe({
      next: (result: any) => {
        console.log('Reset successful:', result);
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Fiskalizacija resetovana, pokretanje...'
        });
        // Kratka pauza pa fiskalizacija
        setTimeout(() => {
          this.performFiscalization(saleId, retryCount);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error resetting fiscalization:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri resetovanju fiskalizacije'
        });
      }
    });
  }

  private performFiscalization(saleId: string, retryCount: number = 0): void {
    const maxRetries = 1;
    
    console.log('Starting fiscalization for sale:', saleId, 'retry:', retryCount);
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Pokretanje fiskalizacije...'
    });
    
    this.posService.fiscalizeSale(saleId, this.currentFacility!._id).subscribe({
      next: (result: any) => {
        console.log('Fiscalization successful:', result);
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Fiskalizacija uspešno završena!'
        });
        this.loadSales();
      },
      error: (error: any) => {
        console.error('Error fiscalizing sale:', error);
        
        // Ako je greška "Fiskalizacija je u toku" i imamo retry, pokušaj ponovo
        if (error.error?.message?.includes('Fiskalizacija je u toku') && retryCount < maxRetries) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Upozorenje',
            detail: `Fiskalizacija u toku, pokušavam ponovo... (${retryCount + 1}/${maxRetries + 1})`
          });
          setTimeout(() => {
            this.resetFiscalizationAndRetry(saleId, retryCount + 1);
          }, 2000);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Greška',
            detail: `Greška pri fiskalizaciji: ${error.error?.message || 'Nepoznata greška'}`
          });
        }
      }
    });
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  /**
   * Vraća severity za status prodaje (PrimeNG)
   */
  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (status) {
      case 'final': return 'success';
      case 'fiscalized': return 'info';
      case 'refunded': return 'warning';
      case 'partial_refund': return 'info';
      default: return 'info';
    }
  }

  /**
   * Vraća tekst za status prodaje
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'final': return 'Završeno';
      case 'fiscalized': return 'Fiskalizovano';
      case 'refunded': return 'Povraćeno';
      case 'partial_refund': return 'Delimično povraćeno';
      default: return status;
    }
  }

  /**
   * Vraća status fiskalizacije
   */
  getFiscalStatus(fiscal: any): string {
    if (!fiscal) return 'N/A';
    switch (fiscal.status) {
      case 'pending': return 'Na čekanju';
      case 'success': return 'Fiskalizovano';
      case 'done': return 'Fiskalizovano'; // Backward compatibility
      case 'error': return 'Greška';
      default: return 'N/A';
    }
  }

  /**
   * Vraća severity za status fiskalizacije (PrimeNG)
   */
  getFiscalSeverity(fiscal: any): 'success' | 'info' | 'warning' | 'danger' {
    if (!fiscal) return 'info';
    switch (fiscal.status) {
      case 'pending': return 'info';
      case 'success': return 'success';
      case 'done': return 'success'; // Backward compatibility
      case 'error': return 'danger';
      default: return 'info';
    }
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
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get session openedBy user data
   * @param sale - Sale object
   * @returns openedBy user name or null
   */
  getSessionOpenedBy(sale: any): string | null {
    return (sale.session as any)?.openedBy?.name || null;
  }
}