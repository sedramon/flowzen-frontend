import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './open-session-dialog.component.html',
  styleUrls: ['./open-session-dialog.component.scss']
})
export class OpenSessionDialogComponent implements OnInit, OnDestroy {
  openSessionForm: FormGroup;
  processing = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly dialogRef: MatDialogRef<OpenSessionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OpenSessionDialogData,
    private readonly fb: FormBuilder,
    private readonly posService: PosService,
    private readonly snackBar: MatSnackBar
  ) {
    this.openSessionForm = this.fb.group({
      facility: ['', Validators.required],
      openingFloat: [0, [Validators.required, Validators.min(0)]],
      note: ['']
    });
  }

  ngOnInit(): void {
    // Set default facility if only one available
    if (this.data.facilities.length === 1) {
        this.openSessionForm.patchValue({
          facility: this.data.facilities[0]._id
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
      this.snackBar.open('Molimo popunite sva obavezna polja', 'Zatvori', { duration: 3000 });
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
          this.snackBar.open('Sesija uspešno otvorena', 'Zatvori', { duration: 2000 });
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error opening session:', error);
          this.snackBar.open('Greška pri otvaranju sesije', 'Zatvori', { duration: 3000 });
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
    const facility = this.data.facilities.find(f => f._id === facilityId);
    return facility?.name || 'N/A';
  }
}
