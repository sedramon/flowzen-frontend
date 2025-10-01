import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Component imports
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosReceiptComponent } from '../pos-receipt/pos-receipt.component';
import { PosRefundComponent } from '../pos-refund/pos-refund.component';
import { PosTransactionViewComponent } from '../pos-transaction-view/pos-transaction-view.component';

// Service imports
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';

// Model imports
import { Client } from '../../../../models/Client';
import { Facility } from '../../../../models/Facility';
import { Service } from '../../../../models/Service';
import { Article } from '../../../../models/Article';

/**
 * POS Sales Component
 * 
 * Glavna komponenta za upravljanje prodajama u POS sistemu.
 * Omogućava kreiranje novih prodaja, pregled postojećih, fiskalizaciju i povraćaje.
 */
@Component({
  selector: 'app-pos-sales',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './pos-sales.component.html',
  styleUrl: './pos-sales.component.scss',
  providers: [AuthService, PosService]
})
export class PosSalesComponent implements OnInit {
  
  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  
  loading = false;
  currentFacility: Facility | null = null;
  
  // Data arrays
  clients: Client[] = [];
  facilities: Facility[] = [];
  services: Service[] = [];
  articles: Article[] = [];
  sales: any[] = [];
  
  // Table configuration
  displayedColumns: string[] = [
    'number', 'date', 'client', 'facility', 'cashier', 
    'status', 'total', 'fiscal', 'actions'
  ];
  
  // Statistics
  totalSales = 0;
  totalRevenue = 0;
  averageSale = 0;
  todayRevenue = 0;

  // ============================================================================
  // CONSTRUCTOR & LIFECYCLE
  // ============================================================================

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Inicijalizuje komponentu - učitava sve potrebne podatke
   */
  private initializeComponent(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      this.snackBar.open('Korisnik nije prijavljen', 'Zatvori', { duration: 3000 });
      this.loading = false;
      return;
    }

    this.loadAllData(currentUser.tenant);
  }

  /**
   * Učitava sve potrebne podatke paralelno
   */
  private loadAllData(tenant: string): void {
    forkJoin({
      facilities: this.posService.getFacilities(tenant).pipe(
        catchError(error => {
          console.error('Error loading facilities:', error);
          return of([]);
        })
      ),
      clients: this.posService.getClients(tenant).pipe(
        catchError(error => {
          console.error('Error loading clients:', error);
          return of([]);
        })
      ),
      services: this.posService.getServices(tenant).pipe(
        catchError(error => {
          console.error('Error loading services:', error);
          return of([]);
        })
      ),
      articles: this.posService.getArticles(tenant).pipe(
        catchError(error => {
          console.error('Error loading articles:', error);
          return of([]);
        })
      )
    }).subscribe({
      next: (data) => {
        this.facilities = data.facilities;
        this.clients = data.clients;
        this.services = data.services;
        this.articles = data.articles;
        
        if (this.facilities.length > 0) {
          this.currentFacility = this.facilities[0];
          this.loadSales();
        } else {
          this.snackBar.open('Nema dostupnih objekata', 'Zatvori', { duration: 3000 });
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.snackBar.open('Greška pri učitavanju podataka', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // ============================================================================
  // SALES DATA MANAGEMENT
  // ============================================================================

  /**
   * Učitava prodaje za trenutni facility
   */
  loadSales(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.currentFacility) {
      console.warn('Cannot load sales: missing user or facility');
      return;
    }

    if (!this.loading) {
      this.loading = true;
    }

    const params = {
      tenant: currentUser.tenant,
      facility: this.currentFacility._id,
      limit: 50,
      sort: '-createdAt'
    };

    this.posService.getSales(params).pipe(
      map((response: any) => {
        let sales = [];
        if (Array.isArray(response)) {
          sales = response;
        } else if (response && Array.isArray(response.data)) {
          sales = response.data;
        } else if (response && response.sales && Array.isArray(response.sales)) {
          sales = response.sales;
        }
        return sales;
      }),
      catchError(error => {
        console.error('Error loading sales:', error);
        this.snackBar.open('Greška pri učitavanju prodaja', 'Zatvori', { duration: 3000 });
        return of(this.sales);
      })
    ).subscribe({
      next: (sales) => {
        console.log('Sales loaded:', sales.length);
        console.log('First sale fiscal status:', sales[0]?.fiscal);
        this.sales = sales || [];
        this.calculateStatistics();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error in loadSales subscribe:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Kalkuliše statistike prodaje
   */
  private calculateStatistics(): void {
    this.totalSales = this.sales.length;
    this.totalRevenue = this.sales.reduce((sum, sale) => sum + (sale.summary?.grandTotal || 0), 0);
    this.averageSale = this.totalSales > 0 ? this.totalRevenue / this.totalSales : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayRevenue = this.sales
      .filter(sale => new Date(sale.date) >= today)
      .reduce((sum, sale) => sum + (sale.summary?.grandTotal || 0), 0);
  }

  // ============================================================================
  // FACILITY MANAGEMENT
  // ============================================================================

  /**
   * Menja trenutni facility i učitava prodaje za novi facility
   */
  onFacilityChange(facilityId: string): void {
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
      this.snackBar.open('Izaberite objekat pre kreiranja prodaje', 'Zatvori', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(PosCheckoutComponent, {
      data: {
        facility: this.currentFacility,
        clients: this.clients,
        services: this.services,
        articles: this.articles,
        total: 0,
        appointment: null,
        tenant: this.authService.getCurrentUser()?.tenant
      },
      panelClass: 'custom-appointment-dialog',
      backdropClass: 'custom-backdrop',
      width: '800px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.id) {
        this.snackBar.open('Prodaja uspešno kreirana!', 'Zatvori', { duration: 2000 });
        this.loadSales();
      }
    });
  }

  /**
   * Otvara dialog za pregled detalja prodaje
   */
  viewSale(sale: any): void {
    const dialogRef = this.dialog.open(PosTransactionViewComponent, {
      data: { transaction: sale },
      panelClass: 'pos-transaction-view-dialog',
      backdropClass: 'custom-backdrop',
      width: '800px',
      maxWidth: '95vw'
    });
  }

  /**
   * Otvara dialog za štampanje računa
   */
  printReceipt(sale: any): void {
    const dialogRef = this.dialog.open(PosReceiptComponent, {
      data: { saleId: sale._id || sale.id },
      panelClass: 'pos-receipt-dialog',
      backdropClass: 'custom-backdrop',
      width: '600px',
      maxWidth: '90vw'
    });
  }

  /**
   * Otvara dialog za povraćaj prodaje
   */
  refundSale(sale: any): void {
    const dialogRef = this.dialog.open(PosRefundComponent, {
      data: { sale: sale },
      panelClass: 'pos-refund-dialog',
      backdropClass: 'custom-backdrop',
      width: '900px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Povraćaj uspešno obrađen', 'Zatvori', { duration: 2000 });
        this.loadSales();
      }
    });
  }

  // ============================================================================
  // FISCALIZATION
  // ============================================================================

  /**
   * Pokreće fiskalizaciju prodaje
   */
  fiscalizeSale(sale: any): void {
    if (!this.currentFacility) {
      this.snackBar.open('Izaberite objekat pre fiskalizacije', 'Zatvori', { duration: 3000 });
      return;
    }

    if (!sale || !sale._id) {
      this.snackBar.open('Nije moguće fiskalizovati prodaju', 'Zatvori', { duration: 3000 });
      return;
    }

    const saleId = sale._id || sale.id;
    
    // Ako je već fiskalizovana, prikaži poruku
    if (sale.fiscal?.status === 'success') {
      this.snackBar.open('Račun je već fiskalizovan', 'Zatvori', { duration: 3000 });
      return;
    }

    // UVIJEK resetuj pre fiskalizacije za sigurnost
    this.resetFiscalizationAndRetry(saleId);
  }

  private resetFiscalizationAndRetry(saleId: string, retryCount: number = 0): void {
    const maxRetries = 1; // Samo jedan retry
    
    if (retryCount === 0) {
      this.snackBar.open('Resetovanje fiskalizacije...', 'Zatvori', { duration: 2000 });
    }
    
    this.posService.resetFiscalization(saleId).subscribe({
      next: (result: any) => {
        console.log('Reset successful:', result);
        this.snackBar.open('Fiskalizacija resetovana, pokretanje...', 'Zatvori', { duration: 1500 });
        // Kratka pauza pa fiskalizacija
        setTimeout(() => {
          this.performFiscalization(saleId, retryCount);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error resetting fiscalization:', error);
        this.snackBar.open('Greška pri resetovanju fiskalizacije', 'Zatvori', { duration: 3000 });
      }
    });
  }

  private performFiscalization(saleId: string, retryCount: number = 0): void {
    const maxRetries = 1;
    
    console.log('Starting fiscalization for sale:', saleId, 'retry:', retryCount);
    this.snackBar.open('Pokretanje fiskalizacije...', 'Zatvori', { duration: 2000 });
    
    this.posService.fiscalizeSale(saleId, this.currentFacility!._id).subscribe({
      next: (result: any) => {
        console.log('Fiscalization successful:', result);
        this.snackBar.open('Fiskalizacija uspešno završena!', 'Zatvori', { duration: 3000 });
        this.loadSales();
      },
      error: (error: any) => {
        console.error('Error fiscalizing sale:', error);
        
        // Ako je greška "Fiskalizacija je u toku" i imamo retry, pokušaj ponovo
        if (error.error?.message?.includes('Fiskalizacija je u toku') && retryCount < maxRetries) {
          this.snackBar.open(`Fiskalizacija u toku, pokušavam ponovo... (${retryCount + 1}/${maxRetries + 1})`, 'Zatvori', { duration: 2000 });
          setTimeout(() => {
            this.resetFiscalizationAndRetry(saleId, retryCount + 1);
          }, 2000);
        } else {
          this.snackBar.open(`Greška pri fiskalizaciji: ${error.error?.message || 'Nepoznata greška'}`, 'Zatvori', { duration: 4000 });
        }
      }
    });
  }

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  /**
   * Vraća boju za status prodaje
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'final': return 'primary';
      case 'fiscalized': return 'accent';
      case 'refunded': return 'warn';
      case 'partial_refund': return 'accent';
      default: return 'basic';
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
   * Vraća boju za status fiskalizacije
   */
  getFiscalColor(fiscal: any): string {
    if (!fiscal) return 'basic';
    switch (fiscal.status) {
      case 'pending': return 'accent';
      case 'success': return 'primary';
      case 'done': return 'primary'; // Backward compatibility
      case 'error': return 'warn';
      default: return 'basic';
    }
  }

  /**
   * Formatira iznos u valuti
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }

  /**
   * Formatira datum za prikaz
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString('sr-RS');
  }
}