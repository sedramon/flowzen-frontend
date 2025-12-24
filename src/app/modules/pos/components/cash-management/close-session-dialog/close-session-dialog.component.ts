import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
    FloatLabelModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    ProgressSpinnerModule,
    CardModule,
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
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly fb: FormBuilder,
    private readonly posService: PosService,
    private readonly messageService: MessageService
  ) {
    this.closeSessionForm = this.fb.group({
      closingCount: [0, [Validators.required, Validators.min(0)]],
      note: ['']
    });
  }

  ngOnInit(): void {
    const data = this.config.data;
    // Set expected cash as default value
    if (data?.session?.expectedCash !== undefined) {
      this.closeSessionForm.patchValue({
        closingCount: data.session.expectedCash
      });
    }
  }

  get data() {
    return this.config.data;
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacija',
        detail: 'Molimo unesite validnu vrednost'
      });
      return;
    }

    this.processing = true;
    const formData = this.closeSessionForm.value;
    const data = this.config.data;
    const closeData: CloseSessionRequest = {
      closingCount: Number(formData.closingCount),
      note: formData.note || undefined
    };

    this.posService.closeSession(data.session.id, closeData).subscribe({
      next: (result) => {
        this.sessionSummary = result;
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Sesija uspešno zatvorena'
        });
        this.ref.close(result);
      },
      error: (error) => {
        console.error('Error closing session:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri zatvaranju sesije'
        });
        this.processing = false;
      }
    });
  }

  /**
   * Zatvara dialog
   */
  cancel(): void {
    this.ref.close();
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
