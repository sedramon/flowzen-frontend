import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { PosService } from '../../../services/pos.service';
import { Facility } from '../../../../../models/Facility';
import { OpenSessionRequest } from '../../../../../models/CashSession';

export interface OpenSessionDialogData {
  facilities: Facility[];
}

@Component({
  selector: 'app-open-session-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FloatLabelModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ButtonModule,
    ProgressSpinnerModule,
    CardModule,
    ReactiveFormsModule
  ],
  templateUrl: './open-session-dialog.component.html',
  styleUrls: ['./open-session-dialog.component.scss']
})
export class OpenSessionDialogComponent implements OnInit, OnDestroy {
  openSessionForm: FormGroup;
  processing = false;
  private readonly destroy$ = new Subject<void>();

  facilityOptions: any[] = [];

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly fb: FormBuilder,
    private readonly posService: PosService,
    private readonly messageService: MessageService
  ) {
    const data = this.config.data;
    
    // Prepare facility options for PrimeNG select
    this.facilityOptions = (data?.facilities || []).map((f: Facility) => ({
      label: f.name,
      value: f._id
    }));
    
    this.openSessionForm = this.fb.group({
      facility: ['', Validators.required],
      openingFloat: [0, [Validators.required, Validators.min(0)]],
      note: ['']
    });
  }

  ngOnInit(): void {
    const data = this.config.data;
    // Set default facility if only one available
    if (data?.facilities?.length === 1) {
        this.openSessionForm.patchValue({
          facility: data.facilities[0]._id
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Otvara novu cash sesiju
   */
  openSession(): void {
    if (this.openSessionForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validacija',
        detail: 'Molimo popunite sva obavezna polja'
      });
      return;
    }

    this.processing = true;

    const formData = this.openSessionForm.value;
    const sessionData: OpenSessionRequest = {
      facility: formData.facility,
      openingFloat: Number(formData.openingFloat),
      note: formData.note || undefined
    };

    this.posService.openSession(sessionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Uspeh',
            detail: 'Sesija uspešno otvorena'
          });
          this.ref.close(result);
        },
        error: (error) => {
          console.error('Error opening session:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Greška',
            detail: 'Greška pri otvaranju sesije'
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
   * Vraća error message za form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.openSessionForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ovo polje je obavezno';
    }
    if (field?.hasError('min')) {
      return 'Vrednost mora biti veća od 0';
    }
    return '';
  }

  /**
   * Vraća naziv odabrane lokacije
   */
  getSelectedFacilityName(): string {
    const facilityId = this.openSessionForm.get('facility')?.value;
    const data = this.config.data;
    const facility = data?.facilities?.find((f: Facility) => f._id === facilityId);
    return facility?.name || 'N/A';
  }
}
