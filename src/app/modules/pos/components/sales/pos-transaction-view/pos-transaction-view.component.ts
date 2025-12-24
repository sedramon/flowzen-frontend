import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

export interface TransactionViewData {
  transaction: any;
}

@Component({
  selector: 'app-pos-transaction-view',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './pos-transaction-view.component.html',
  styleUrls: ['./pos-transaction-view.component.scss']
})
export class PosTransactionViewComponent implements OnInit {
  transaction: any;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.transaction = config.data?.transaction;
  }

  ngOnInit(): void {
    // Initialize component
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('sr-RS', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '0,00 RSD';
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getPaymentMethodText(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Gotovina',
      'card': 'Kartica',
      'bank_transfer': 'Bankovni transfer',
      'check': 'Ček'
    };
    return methods[method] || method;
  }

  getStatusText(transaction: any): string {
    // Proveri da li je fiskalizovano
    if (transaction.sale?.fiscal?.status === 'success') {
      return 'Fiskalizovano';
    }
    
    // Proveri da li je na čekanju fiskalizacije
    if (transaction.sale?.fiscal?.status === 'pending') {
      return 'Na čekanju fiskalizacije';
    }
    
    // Proveri da li je greška u fiskalizaciji
    if (transaction.sale?.fiscal?.status === 'error') {
      return 'Greška u fiskalizaciji';
    }
    
    // Proveri osnovni status
    const status = transaction.status || transaction.sale?.status;
    const statuses: { [key: string]: string } = {
      'pending': 'Na čekanju',
      'completed': 'Završeno',
      'final': 'Završeno',
      'cancelled': 'Otkazano',
      'refunded': 'Refundirano',
      'partial_refund': 'Delimično povraćeno'
    };
    return statuses[status] || 'Nepoznato';
  }

  getStatusSeverity(transaction: any): 'success' | 'info' | 'warning' | 'danger' {
    // Proveri da li je fiskalizovano
    if (transaction.sale?.fiscal?.status === 'success') {
      return 'success';
    }
    
    // Proveri da li je na čekanju fiskalizacije
    if (transaction.sale?.fiscal?.status === 'pending') {
      return 'warning';
    }
    
    // Proveri da li je greška u fiskalizaciji
    if (transaction.sale?.fiscal?.status === 'error') {
      return 'danger';
    }
    
    // Proveri osnovni status
    const status = transaction.status || transaction.sale?.status;
    const severities: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'pending': 'warning',
      'completed': 'success',
      'final': 'success',
      'cancelled': 'danger',
      'refunded': 'info',
      'partial_refund': 'info'
    };
    return severities[status] || 'info';
  }

  printTransaction(): void {
    // Print functionality
    window.print();
  }

  closeDialog(): void {
    this.ref.close();
  }
}
