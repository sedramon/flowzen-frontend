import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
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
    FloatLabelModule,
    InputNumberModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
    CardModule,
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
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private fb: FormBuilder,
    private posService: PosService,
    private messageService: MessageService
  ) {
    this.countingForm = this.fb.group({
      countedCash: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const data = this.config.data;
    // Set expected cash as default value
    if (data?.session?.expectedCash !== undefined) {
      this.countingForm.patchValue({
        countedCash: data.session.expectedCash
      });
    }
  }

  get data() {
    return this.config.data;
  }

  /**
   * Broji cash u sesiji
   */
  countCash(): void {
    if (this.countingForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacija',
        detail: 'Molimo unesite validnu vrednost'
      });
      return;
    }

    this.processing = true;
    const formData = this.countingForm.value;
    const data = this.config.data;
    const countingData: CashCountingRequest = {
      countedCash: Number(formData.countedCash),
      note: formData.note || undefined,
      cashInDrawer: formData.cashInDrawer ? Number(formData.cashInDrawer) : undefined,
      cashInRegister: formData.cashInRegister ? Number(formData.cashInRegister) : undefined
    };

    this.posService.countCash(data.session.id, countingData).subscribe({
      next: (result) => {
        this.countingResult = result;
        this.processing = false;
      },
      error: (error) => {
        console.error('Error counting cash:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri brojanju cash-a'
        });
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
    const data = this.config.data;
    const verificationData: CashVerificationRequest = {
      actualCash: Number(formData.countedCash),
      note: formData.note || undefined
    };

    this.posService.verifyCashCount(data.session.id, verificationData).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Cash uspešno verifikovan'
        });
        this.processing = false;
        // Ne zatvaramo dialog automatski - korisnik može da nastavi sa brojanjem
      },
      error: (error) => {
        console.error('Error verifying cash count:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri verifikaciji cash-a'
        });
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
    const data = this.config.data;
    const varianceData: CashVarianceRequest = {
      actualCash: Number(formData.countedCash),
      action: action,
      reason: reason,
      note: formData.note || undefined
    };

    this.posService.handleCashVariance(data.session.id, varianceData).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Uspeh',
          detail: 'Variance uspešno obrađena'
        });
        this.processing = false;
        this.ref.close(result);
      },
      error: (error) => {
        console.error('Error handling variance:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Greška',
          detail: 'Greška pri obradi variance'
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
   * Vraća boju za status variance (za backward compatibility)
   * @deprecated Koristi getVarianceStatusSeverity umesto toga
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
   * Vraća severity za status variance (PrimeNG)
   */
  getVarianceStatusSeverity(status: string): 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'acceptable': return 'success';
      case 'warning': return 'warning';
      case 'critical':
      case 'severe': return 'danger';
      default: return 'success';
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
   * Vraća ikonu za variance (PrimeIcons)
   */
  getVarianceIcon(variance: number): string {
    if (variance > 0) return 'pi-arrow-up';
    if (variance < 0) return 'pi-arrow-down';
    return 'pi-minus';
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
