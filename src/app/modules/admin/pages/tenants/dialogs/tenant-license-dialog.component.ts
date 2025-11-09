import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

export interface TenantLicenseDialogData {
  hasActiveLicense?: boolean;
  licenseStartDate?: string | null;
  licenseExpiryDate?: string | null;
}

export interface TenantLicenseDialogResult {
  hasActiveLicense: boolean;
  licenseStartDate?: string | null;
  licenseExpiryDate?: string | null;
}

@Component({
  selector: 'app-tenant-license-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Ažuriraj licencu</h2>

    <form [formGroup]="form" (ngSubmit)="submit()" class="dialog-form">
      <mat-dialog-content>
        <div class="dialog-grid">
          <mat-slide-toggle formControlName="hasActiveLicense">
            Licenca je aktivna
          </mat-slide-toggle>

          <mat-form-field appearance="outline">
            <mat-label>Datum početka</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="licenseStartDate" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Datum isteka</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="licenseExpiryDate" />
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
            <mat-error *ngIf="form.get('licenseExpiryDate')?.hasError('minDate')">
              Datum isteka mora biti posle početka.
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Sačuvaj
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .dialog-form {
        min-width: 420px;
        max-width: 480px;
      }

      .dialog-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        align-items: center;
      }

      mat-slide-toggle {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class TenantLicenseDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef =
    inject(MatDialogRef<TenantLicenseDialogComponent, TenantLicenseDialogResult>);
  readonly data = inject<TenantLicenseDialogData>(MAT_DIALOG_DATA, { optional: true }) || {};

  readonly form: FormGroup = this.fb.group(
    {
      hasActiveLicense: [this.data.hasActiveLicense ?? true],
      licenseStartDate: [this.coerceDate(this.data.licenseStartDate)],
      licenseExpiryDate: [this.coerceDate(this.data.licenseExpiryDate)],
    },
    { validators: this.validateDates },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const hasActiveLicense =
      this.form.get('hasActiveLicense')?.value === true;
    const licenseStartDate = this.form.get('licenseStartDate')?.value as Date | null | undefined;
    const licenseExpiryDate = this.form.get('licenseExpiryDate')?.value as Date | null | undefined;

    if (!hasActiveLicense) {
      this.dialogRef.close({
        hasActiveLicense,
        licenseStartDate: null,
        licenseExpiryDate: null,
      });
      return;
    }

    this.dialogRef.close({
      hasActiveLicense,
      licenseStartDate: this.toIsoString(licenseStartDate),
      licenseExpiryDate: this.toIsoString(licenseExpiryDate),
    });
  }

  private coerceDate(value?: string | null): Date | null {
    return value ? new Date(value) : null;
  }

  private toIsoString(value?: Date | null): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    return value ? new Date(value).toISOString() : null;
  }

  private validateDates(group: FormGroup) {
    const start: Date | null = group.get('licenseStartDate')?.value || null;
    const end: Date | null = group.get('licenseExpiryDate')?.value || null;

    if (start && end && end < start) {
      group.get('licenseExpiryDate')?.setErrors({ minDate: true });
    } else {
      const currentErrors = group.get('licenseExpiryDate')?.errors;
      if (currentErrors) {
        delete currentErrors['minDate'];
        if (!Object.keys(currentErrors).length) {
          group.get('licenseExpiryDate')?.setErrors(null);
        }
      }
    }
    return null;
  }
}


