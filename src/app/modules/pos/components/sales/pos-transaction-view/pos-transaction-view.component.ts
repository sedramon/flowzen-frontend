import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TransactionViewData {
  transaction: any;
}

@Component({
  selector: 'app-pos-transaction-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './pos-transaction-view.component.html',
  styleUrls: ['./pos-transaction-view.component.scss']
})
export class PosTransactionViewComponent implements OnInit {
  transaction: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TransactionViewData,
    private dialogRef: MatDialogRef<PosTransactionViewComponent>,
    private snackBar: MatSnackBar
  ) {
    this.transaction = data.transaction;
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

  getStatusColor(transaction: any): string {
    // Proveri da li je fiskalizovano
    if (transaction.sale?.fiscal?.status === 'success') {
      return '#66bb6a'; // Svetlija zelena - fiskalizovano
    }
    
    // Proveri da li je na čekanju fiskalizacije
    if (transaction.sale?.fiscal?.status === 'pending') {
      return '#ffb74d'; // Svetlija narandžasta - na čekanju
    }
    
    // Proveri da li je greška u fiskalizaciji
    if (transaction.sale?.fiscal?.status === 'error') {
      return '#ef5350'; // Svetlija crvena - greška
    }
    
    // Proveri osnovni status
    const status = transaction.status || transaction.sale?.status;
    const colors: { [key: string]: string } = {
      'pending': '#ffb74d',
      'completed': '#ab47bc', // Svetlija naša boja
      'final': '#ab47bc', // Svetlija naša boja
      'cancelled': '#ef5350',
      'refunded': '#ba68c8', // Svetlija ljubičasta
      'partial_refund': '#f48fb1' // Svetlija roza
    };
    return colors[status] || '#bdbdbd'; // Svetlija siva
  }

  printTransaction(): void {
    // Print functionality
    window.print();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
