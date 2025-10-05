import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PosService } from '../../../services/pos.service';
import { CashCountingRequest, CashCountingResult, CashSession, CashVarianceRequest, CashVerificationRequest, VarianceAction } from '../../../../../models/CashSession';

export interface CashCountingDialogData {
  session: CashSession;
}

@Component({
  selector: 'app-cash-counting-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    ReactiveFormsModule
  ],
  templateUrl: './cash-counting-dialog.component.html',
  styleUrls: ['./cash-counting-dialog.component.scss']
})
export class CashCountingDialogComponent implements OnInit {
  countingForm: FormGroup;
  processing = false;
  countingResult: CashCountingResult | null = null;

  constructor(
    private dialogRef: MatDialogRef<CashCountingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CashCountingDialogData,
    private fb: FormBuilder,
    private posService: PosService,
    private snackBar: MatSnackBar
  ) {
    this.countingForm = this.fb.group({
      countedCash: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Set expected cash as default value
    this.countingForm.patchValue({
      countedCash: this.data.session.expectedCash
    });
  }

  /**
   * Broji cash u sesiji
   */
  countCash(): void {
    if (this.countingForm.invalid) {
      this.snackBar.open('Molimo unesite validnu vrednost', 'Zatvori', { duration: 3000 });
      return;
    }

    this.processing = true;
    const formData = this.countingForm.value;
    const countingData: CashCountingRequest = {
      countedCash: Number(formData.countedCash),
      note: formData.note || undefined,
      cashInDrawer: formData.cashInDrawer ? Number(formData.cashInDrawer) : undefined,
      cashInRegister: formData.cashInRegister ? Number(formData.cashInRegister) : undefined
    };

    this.posService.countCash(this.data.session.id, countingData).subscribe({
      next: (result) => {
        this.countingResult = result;
        this.processing = false;
      },
      error: (error) => {
        console.error('Error counting cash:', error);
        this.snackBar.open('Greška pri brojanju cash-a', 'Zatvori', { duration: 3000 });
        this.processing = false;
      }
    });
  }

  /**
   * Verifikuje brojanje
   */
  verifyCount(): void {
    if (!this.countingResult) return;

    this.processing = true;
    const formData = this.countingForm.value;
    const verificationData: CashVerificationRequest = {
      actualCash: Number(formData.countedCash),
      note: formData.note || undefined
    };

    this.posService.verifyCashCount(this.data.session.id, verificationData).subscribe({
      next: (result) => {
        this.snackBar.open('Cash uspešno verifikovan', 'Zatvori', { duration: 2000 });
        this.processing = false;
        // Ne zatvaramo dialog automatski - korisnik može da nastavi sa brojanjem
      },
      error: (error) => {
        console.error('Error verifying cash count:', error);
        this.snackBar.open('Greška pri verifikaciji cash-a', 'Zatvori', { duration: 3000 });
        this.processing = false;
      }
    });
  }

  /**
   * Rukuje variance (nedostatak/višak novca)
   */
  handleVariance(action: VarianceAction, reason: string): void {
    if (!this.countingResult) return;

    this.processing = true;
    const formData = this.countingForm.value;
    const varianceData: CashVarianceRequest = {
      actualCash: Number(formData.countedCash),
      action: action,
      reason: reason,
      note: formData.note || undefined
    };

    this.posService.handleCashVariance(this.data.session.id, varianceData).subscribe({
      next: (result) => {
        this.snackBar.open('Variance uspešno obrađena', 'Zatvori', { duration: 2000 });
        this.processing = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error handling variance:', error);
        this.snackBar.open('Greška pri obradi variance', 'Zatvori', { duration: 3000 });
        this.processing = false;
      }
    });
  }

  /**
   * Zatvara dialog
   */
  cancel(): void {
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
   * Vraća boju za status variance
   */
  getVarianceColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'acceptable': return 'primary';
      case 'warning': return 'accent';
      case 'critical':
      case 'severe': return 'warn';
      default: return 'primary';
    }
  }

  /**
   * Vraća tekst za status variance
   */
  getVarianceStatusText(status: string): string {
    switch (status) {
      case 'acceptable': return 'Prihvatljivo';
      case 'warning': return 'Upozorenje';
      case 'critical': return 'Kritično';
      case 'severe': return 'Ozbiljno';
      default: return 'Nepoznato';
    }
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
   * Vraća error message za form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.countingForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ovo polje je obavezno';
    }
    if (field?.hasError('min')) {
      return 'Vrednost mora biti veća od 0';
    }
    return '';
  }
}
