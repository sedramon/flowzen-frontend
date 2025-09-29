import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PosService } from '../../services/pos.service';
import { AuthService } from '../../../../core/services/auth.service';

interface ReportData {
  date: string;
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  employee: string;
  facility: string;
}

@Component({
  selector: 'app-pos-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    ReactiveFormsModule
  ],
  templateUrl: './pos-reports.component.html',
  styleUrl: './pos-reports.component.scss',
  providers: [AuthService, PosService]
})
export class PosReportsComponent implements OnInit {
  reportData: ReportData[] = [];
  loading = false;
  displayedColumns: string[] = ['date', 'facility', 'employee', 'totalSales', 'totalAmount', 'averageAmount'];
  
  // Filters
  dateFrom = new FormControl<Date | null>(null);
  dateTo = new FormControl<Date | null>(null);
  facilityFilter = new FormControl<string>('');
  facilities: any[] = [];

  constructor(
    private posService: PosService,
    @Inject(AuthService) private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadFacilities();
    this.loadReports();
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
    if (!currentUser) return;

    this.posService.getFacilities(currentUser.tenant).subscribe(facilities => {
      this.facilities = facilities;
    });
  }

  loadReports(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const filters = {
      dateFrom: this.dateFrom.value?.toISOString().split('T')[0],
      dateTo: this.dateTo.value?.toISOString().split('T')[0],
      facility: this.facilityFilter.value
    };

    this.posService.getReports(currentUser.tenant, filters).subscribe({
      next: (reports) => {
        this.reportData = reports;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.snackBar.open('Greška pri učitavanju izveštaja', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadReports();
  }

  exportToExcel(): void {
    this.posService.exportReports(this.reportData).subscribe({
      next: () => {
        this.snackBar.open('Izveštaj uspešno izvezen', 'Zatvori', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error exporting reports:', error);
        this.snackBar.open('Greška pri izvozu izveštaja', 'Zatvori', { duration: 3000 });
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sr-RS');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }

  getTotalSales(): number {
    return this.reportData.reduce((sum, item) => sum + item.totalSales, 0);
  }

  getTotalAmount(): number {
    return this.reportData.reduce((sum, item) => sum + item.totalAmount, 0);
  }

  getAverageAmount(): number {
    const total = this.getTotalAmount();
    const sales = this.getTotalSales();
    return sales > 0 ? total / sales : 0;
  }
}
