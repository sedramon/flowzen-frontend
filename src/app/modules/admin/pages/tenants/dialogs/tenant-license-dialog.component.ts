import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatNativeDateModule,
  MAT_NATIVE_DATE_FORMATS,
  NativeDateAdapter,
} from '@angular/material/core';

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
    MatIconModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="admin-dialog admin-dialog--tenants tenant-license-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>verified</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>Ažuriraj licencu</h2>
          <p>Upravljaj statusom licence, datumom početka i isteka za odabranog tenanta.</p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content tenant-license-dialog__content">
        <div class="dialog-grid">
          <mat-slide-toggle formControlName="hasActiveLicense" class="admin-toggle">
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

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Sačuvaj
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .tenant-license-dialog__content {
        max-width: 820px;
      }

      .tenant-license-dialog .dialog-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        align-items: center;
        min-width: 0;
      }

      .tenant-license-dialog mat-slide-toggle {
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
      const fallbackStart =
        licenseStartDate ??
        (this.data.licenseStartDate ? new Date(this.data.licenseStartDate) : new Date());
      const fallbackExpiry =
        licenseExpiryDate ??
        (this.data.licenseExpiryDate ? new Date(this.data.licenseExpiryDate) : fallbackStart);

      this.dialogRef.close({
        hasActiveLicense,
        licenseStartDate: this.toIsoString(fallbackStart),
        licenseExpiryDate: this.toIsoString(fallbackExpiry),
      });
      return;
    }

    const payload: TenantLicenseDialogResult = {
      hasActiveLicense,
      licenseStartDate: this.toIsoString(licenseStartDate),
      licenseExpiryDate: this.toIsoString(licenseExpiryDate),
    };

    if (payload.licenseStartDate === undefined || payload.licenseStartDate === null) {
      delete payload.licenseStartDate;
    }

    if (payload.licenseExpiryDate === undefined || payload.licenseExpiryDate === null) {
      delete payload.licenseExpiryDate;
    }

    this.dialogRef.close(payload);
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


