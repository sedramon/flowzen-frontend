import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PosService } from '../../../services/pos.service';
import { RefundSaleRequest, RefundResponse } from '../../../../../models/Sale';

interface RefundData {
  sale: any;
  refundAmount: number;
  refundMethod: string;
  reason: string;
}

@Component({
  selector: 'app-pos-refund',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './pos-refund.component.html',
  styleUrl: './pos-refund.component.scss'
})
export class PosRefundComponent implements OnInit {
  refundForm: FormGroup;
  sale: any = null;
  loading = false;
  processing = false;

  paymentMethods = [
    { value: 'cash', label: 'Gotovina' },
    { value: 'card', label: 'Kartica' },
    { value: 'voucher', label: 'Voucher' },
    { value: 'gift', label: 'Poklon bon' },
    { value: 'bank', label: 'Bankovni transfer' },
    { value: 'other', label: 'Ostalo' }
  ];

  constructor(
    private fb: FormBuilder,
    private posService: PosService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PosRefundComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { sale: any }
  ) {
    this.sale = data.sale;
    this.refundForm = this.fb.group({
      refundAmount: [this.sale?.summary?.grandTotal || 0, [Validators.required, Validators.min(0.01), Validators.max(this.sale?.summary?.grandTotal || 0)]],
      refundMethod: ['cash', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Set max refund amount
    const maxAmount = this.sale?.summary?.grandTotal || 0;
    this.refundForm.get('refundAmount')?.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(maxAmount)
    ]);
  }

  processRefund(): void {
    if (this.refundForm.invalid) {
      this.snackBar.open('Molimo popunite sva obavezna polja', 'Zatvori', { duration: 3000 });
      return;
    }

    this.processing = true;

    // 1. Kreiraj refund items (refundiraj sve stavke)
    const refundItems = this.sale.items.map((item: any) => ({
      refId: item.refId,
      qty: Number(item.qty),
      amount: Number(item.price || 0) // Koristimo price ako amount nije definisan
    }));

    // 2. Kreiraj refund summary
    const refundSummary = {
      subtotal: Number(this.sale.summary.subtotal),
      discountTotal: Number(this.sale.summary.discountTotal || 0),
      taxTotal: Number(this.sale.summary.taxTotal || 0),
      tip: Number(this.sale.summary.tip || 0),
      grandTotal: Number(this.refundForm.value.refundAmount)
    };

    // 3. Kreiraj refund payment
    const refundPayment = {
      method: this.refundForm.value.refundMethod,
      amount: Number(this.refundForm.value.refundAmount),
      change: 0,
      externalRef: ''
    };

    // 4. Kreiraj refund data prema DTO
    const refundData: RefundSaleRequest = {
      items: refundItems,
      amount: Number(this.refundForm.value.refundAmount),
      reason: this.refundForm.value.reason,
      summary: refundSummary,
      payments: [refundPayment]
    };

    this.posService.refundSale(this.sale._id || this.sale.id, refundData).subscribe({
      next: (result) => {
        this.snackBar.open('Povraćaj uspešno obrađen', 'Zatvori', { duration: 2000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error processing refund:', error);
        this.snackBar.open('Greška pri obradi povraćaja', 'Zatvori', { duration: 3000 });
        this.processing = false;
      }
    });
  }

  cancelRefund(): void {
    this.dialogRef.close();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD'
    }).format(amount);
  }

  getMaxRefundAmount(): number {
    return this.sale?.summary?.grandTotal || 0;
  }

  getRefundAmountError(): string {
    const control = this.refundForm.get('refundAmount');
    if (control?.hasError('required')) return 'Iznos povraćaja je obavezan';
    if (control?.hasError('min')) return 'Iznos mora biti veći od 0';
    if (control?.hasError('max')) return 'Iznos ne može biti veći od originalne vrednosti';
    return '';
  }

  getReasonError(): string {
    const control = this.refundForm.get('reason');
    if (control?.hasError('required')) return 'Razlog povraćaja je obavezan';
    if (control?.hasError('minlength')) return 'Razlog mora imati najmanje 10 karaktera';
    return '';
  }
}

