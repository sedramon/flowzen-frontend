import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CashSession, CashReconciliationResult } from '../../../../../models/CashSession';
import { PosService } from '../../../services/pos.service';

export interface CashReconciliationDialogData {
  session: CashSession;
}

@Component({
  selector: 'app-cash-reconciliation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './cash-reconciliation-dialog.component.html',
  styleUrls: ['./cash-reconciliation-dialog.component.scss']
})
export class CashReconciliationDialogComponent implements OnInit {
  loading = true;
  reconciliationData: CashReconciliationResult | null = null;

  constructor(
    private dialogRef: MatDialogRef<CashReconciliationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashReconciliationDialogData,
    private posService: PosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReconciliationData();
  }

  /**
   * Učitava podatke za usklađivanje
   */
  private loadReconciliationData(): void {
    this.loading = true;

    this.posService.reconcileSession(this.data.session.id).subscribe({
      next: (result) => {
        this.reconciliationData = result;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reconciliation data:', error);
        this.snackBar.open('Greška pri učitavanju podataka za usklađivanje', 'Zatvori', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Zatvara dialog
   */
  close(): void {
    this.dialogRef.close();
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
   * Vraća boju za payment method
   */
  getPaymentMethodColor(method: string): 'primary' | 'accent' | 'warn' {
    switch (method) {
      case 'cash': return 'primary';
      case 'card': return 'accent';
      case 'voucher': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Vraća ikonu za payment method
   */
  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'cash': return 'attach_money';
      case 'card': return 'credit_card';
      case 'voucher': return 'confirmation_number';
      case 'gift': return 'card_giftcard';
      case 'bank': return 'account_balance';
      default: return 'payment';
    }
  }

  /**
   * Vraća tekst za payment method
   */
  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Gotovina';
      case 'card': return 'Kartica';
      case 'voucher': return 'Vaučer';
      case 'gift': return 'Poklon';
      case 'bank': return 'Bankovni';
      case 'other': return 'Ostalo';
      default: return method;
    }
  }

  /**
   * Vraća payment methods kao array za iteraciju
   */
  getPaymentMethods(): Array<{ key: string; value: number }> {
    if (!this.reconciliationData) return [];
    
    return Object.entries(this.reconciliationData.totalsByMethod)
      .filter(([key, value]) => (value as number) > 0)
      .map(([key, value]) => ({ key, value: value as number }));
  }
}
