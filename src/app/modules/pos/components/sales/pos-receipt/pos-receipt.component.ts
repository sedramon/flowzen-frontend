import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PosService } from '../../../services/pos.service';

interface ReceiptData {
  sale: any;
  facility: any;
  cashier: any;
  client?: any;
}

@Component({
  selector: 'app-pos-receipt',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './pos-receipt.component.html',
  styleUrl: './pos-receipt.component.scss'
})
export class PosReceiptComponent implements OnInit {
  receiptData: ReceiptData | null = null;
  loading = false;

  constructor(
    private posService: PosService,
    public dialogRef: MatDialogRef<PosReceiptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: string }
  ) {}

  ngOnInit(): void {
    this.loadReceiptData();
  }

  loadReceiptData(): void {
    this.loading = true;
    this.posService.getSale(this.data.saleId).subscribe({
      next: (sale) => {
        this.receiptData = {
          sale: sale,
          facility: sale.facility,
          cashier: sale.cashier,
          client: sale.client
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading receipt data:', error);
        this.loading = false;
      }
    });
  }

  printReceipt(): void {
    window.print();
  }

  closeDialog(): void {
    this.dialogRef.close();
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

  getPaymentMethodText(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Gotovina',
      'card': 'Kartica',
      'voucher': 'Voucher',
      'gift': 'Poklon bon',
      'bank': 'Bankovni transfer',
      'other': 'Ostalo'
    };
    return methods[method] || method;
  }
}

