import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { PosService } from '../../../services/pos.service';
import { CashSession, CashSessionSummary, CloseSessionRequest } from '../../../../../models/CashSession';

export interface CloseSessionDialogData {
  session: CashSession;
}

@Component({
  selector: 'app-close-session-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    ReactiveFormsModule
  ],
  templateUrl: './close-session-dialog.component.html',
  styleUrls: ['./close-session-dialog.component.scss']
})
export class CloseSessionDialogComponent implements OnInit, OnDestroy {
  closeSessionForm: FormGroup;
  processing = false;
  sessionSummary: CashSessionSummary | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly dialogRef: MatDialogRef<CloseSessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CloseSessionDialogData,
    private readonly fb: FormBuilder,
    private readonly posService: PosService,
    private readonly snackBar: MatSnackBar
  ) {
    this.closeSessionForm = this.fb.group({
      closingCount: [0, [Validators.required, Validators.min(0)]],
      note: ['']
    });
  }

  ngOnInit(): void {
    // Set expected cash as default value
    this.closeSessionForm.patchValue({
      closingCount: this.data.session.expectedCash
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Zatvara sesiju
   */
  closeSession(): void {
    if (this.closeSessionForm.invalid) {
      this.snackBar.open('Molimo unesite validnu vrednost', 'Zatvori', { duration: 3000 });
      return;
    }

    this.processing = true;
    const formData = this.closeSessionForm.value;
    const closeData: CloseSessionRequest = {
      closingCount: Number(formData.closingCount),
      note: formData.note || undefined
    };

    this.posService.closeSession(this.data.session.id, closeData).subscribe({
      next: (result) => {
        this.sessionSummary = result;
        this.snackBar.open('Sesija uspešno zatvorena', 'Zatvori', { duration: 2000 });
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error closing session:', error);
        this.snackBar.open('Greška pri zatvaranju sesije', 'Zatvori', { duration: 3000 });
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
   * Formatira datum za prikaz
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
   * Vraća error message za form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.closeSessionForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ovo polje je obavezno';
    }
    if (field?.hasError('min')) {
      return 'Vrednost mora biti veća od 0';
    }
    return '';
  }
}
