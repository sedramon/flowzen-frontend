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
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosReceiptComponent } from '../pos-receipt/pos-receipt.component';
import { PosRefundComponent } from '../pos-refund/pos-refund.component';
import { PosTransactionViewComponent } from '../pos-transaction-view/pos-transaction-view.component';
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Client } from '../../../../models/Client';
import { Facility } from '../../../../models/Facility';
import { Service } from '../../../../models/Service';
import { Article } from '../../../../models/Article';

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
  clients: Client[] = [];
  facilities: Facility[] = [];
  services: Service[] = [];
  articles: Article[] = [];
  currentFacility: Facility | null = null;
  loading = false;
  
  // Sales data
  sales: any[] = [];
  displayedColumns: string[] = ['number', 'date', 'client', 'facility', 'cashier', 'status', 'total', 'fiscal', 'actions'];
  
  // Statistics
  totalSales = 0;
  totalRevenue = 0;
  averageSale = 0;
  todayRevenue = 0;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadSales();
  }

  loadData(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    // Load facilities
    this.posService.getFacilities(currentUser.tenant).subscribe(facilities => {
      this.facilities = facilities;
      if (facilities.length > 0) {
        this.currentFacility = facilities[0];
      }
    });

    // Load clients
    this.posService.getClients(currentUser.tenant).subscribe(clients => {
      this.clients = clients;
    });

    // Load services
    this.posService.getServices(currentUser.tenant).subscribe(services => {
      this.services = services;
    });

    // Load articles
    this.posService.getArticles(currentUser.tenant).subscribe(articles => {
      this.articles = articles;
      this.loading = false;
    });
  }

  loadSales(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const params = {
      tenant: currentUser.tenant,
      facility: this.currentFacility?._id || '',
      limit: 50,
      sort: '-createdAt'
    };

    this.posService.getSales(params).subscribe({
      next: (sales) => {
        this.sales = sales;
        this.calculateStatistics();
      },
      error: (error) => {
        console.error('Error loading sales:', error);
        this.snackBar.open('Greška pri učitavanju prodaja', 'Zatvori', { duration: 3000 });
      }
    });
  }

  calculateStatistics(): void {
    this.totalSales = this.sales.length;
    this.totalRevenue = this.sales.reduce((sum, sale) => sum + (sale.summary?.grandTotal || 0), 0);
    this.averageSale = this.totalSales > 0 ? this.totalRevenue / this.totalSales : 0;
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.todayRevenue = this.sales
      .filter(sale => new Date(sale.date) >= today)
      .reduce((sum, sale) => sum + (sale.summary?.grandTotal || 0), 0);
  }

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
        this.loadSales(); // Refresh sales list
      }
    });
  }

  onFacilityChange(facilityId: string): void {
    this.currentFacility = this.facilities.find(f => f._id === facilityId) || null;
    this.loadSales(); // Reload sales for selected facility
  }

  viewSale(sale: any): void {
    const dialogRef = this.dialog.open(PosTransactionViewComponent, {
      data: { transaction: sale },
      panelClass: 'pos-transaction-view-dialog',
      backdropClass: 'custom-backdrop',
      width: '800px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Transaction view dialog closed
    });
  }

  printReceipt(sale: any): void {
    const dialogRef = this.dialog.open(PosReceiptComponent, {
      data: { saleId: sale._id || sale.id },
      panelClass: 'pos-receipt-dialog',
      backdropClass: 'custom-backdrop',
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Receipt dialog closed
    });
  }

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
        this.loadSales(); // Refresh sales list
      }
    });
  }

  fiscalizeSale(sale: any): void {
    if (!this.currentFacility) {
      this.snackBar.open('Izaberite objekat pre fiskalizacije', 'Zatvori', { duration: 3000 });
      return;
    }

    this.posService.fiscalizeSale(sale._id || sale.id, this.currentFacility?._id || '').subscribe({
      next: (result) => {
        this.snackBar.open('Fiskalizacija uspešno pokrenuta', 'Zatvori', { duration: 2000 });
        this.loadSales(); // Refresh sales list
      },
      error: (error) => {
        console.error('Error fiscalizing sale:', error);
        this.snackBar.open('Greška pri fiskalizaciji', 'Zatvori', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'final': return 'primary';
      case 'refunded': return 'warn';
      case 'partial_refund': return 'accent';
      default: return 'basic';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'final': return 'Završeno';
      case 'refunded': return 'Povraćeno';
      case 'partial_refund': return 'Delimično povraćeno';
      default: return status;
    }
  }

  getFiscalStatus(fiscal: any): string {
    if (!fiscal) return 'N/A';
    switch (fiscal.status) {
      case 'pending': return 'Na čekanju';
      case 'done': return 'Fiskalizovano';
      case 'error': return 'Greška';
      default: return 'N/A';
    }
  }

  getFiscalColor(fiscal: any): string {
    if (!fiscal) return 'basic';
    switch (fiscal.status) {
      case 'pending': return 'accent';
      case 'done': return 'primary';
      case 'error': return 'warn';
      default: return 'basic';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('sr-RS');
  }
}
