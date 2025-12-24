import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
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
    ButtonModule,
    ProgressSpinnerModule,
    CardModule
  ],
  templateUrl: './cash-reconciliation-dialog.component.html',
  styleUrls: ['./cash-reconciliation-dialog.component.scss']
})
export class CashReconciliationDialogComponent implements OnInit {
  loading = true;
  reconciliationData: CashReconciliationResult | null = null;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private posService: PosService,
    private messageService: MessageService
  ) {}

  get data() {
    return this.config.data;
  }

  ngOnInit(): void {
    this.loadReconciliationData();
  }

  /**
   * Učitava podatke za usklađivanje
   */
  private loadReconciliationData(): void {
    this.loading = true;
    const data = this.config.data;

    this.posService.reconcileSession(data.session.id).subscribe({
      next: (result) => {
        this.reconciliationData = result;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reconciliation data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri učitavanju podataka za usklađivanje'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Zatvara dialog
   */
  close(): void {
    this.ref.close();
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
   * Vraća ikonu za variance (PrimeIcons)
   */
  getVarianceIcon(variance: number): string {
    if (variance > 0) return 'pi-arrow-up';
    if (variance < 0) return 'pi-arrow-down';
    return 'pi-minus';
  }

  /**
   * Vraća severity za variance (PrimeNG)
   */
  getVarianceSeverity(variance: number): 'success' | 'warning' | 'danger' {
    const absVariance = Math.abs(variance);
    if (absVariance <= 100) return 'success';
    if (absVariance <= 500) return 'warning';
    return 'danger';
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
   * Vraća ikonu za payment method (PrimeIcons)
   */
  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'cash': return 'pi-dollar';
      case 'card': return 'pi-credit-card';
      case 'voucher': return 'pi-ticket';
      case 'gift': return 'pi-gift';
      case 'bank': return 'pi-building';
      default: return 'pi-money-bill';
    }
  }

  /**
   * Vraća severity za payment method (PrimeNG)
   */
  getPaymentMethodSeverity(method: string): 'success' | 'info' | 'warning' | 'danger' {
    switch (method) {
      case 'cash': return 'success';
      case 'card': return 'info';
      case 'voucher': return 'warning';
      default: return 'info';
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
