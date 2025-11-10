import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TenantCreateDialogData {
  title?: string;
}

export interface TenantCreateDialogResult {
  name: string;
  companyType: string;
  street: string;
  city: string;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
  PIB?: string;
  MIB?: string;
}

@Component({
  selector: 'app-tenant-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="admin-dialog admin-dialog--tenants tenant-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>apartment</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>{{ data?.title || 'Novi tenant' }}</h2>
          <p>Postavi osnovne informacije o kompaniji, kontaktima i identifikacionim brojevima.</p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content tenant-dialog__content">
        <div class="dialog-grid">
          <mat-form-field appearance="outline">
            <mat-label>Naziv</mat-label>
            <input matInput formControlName="name" required />
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              Naziv je obavezan.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tip kompanije</mat-label>
            <input matInput formControlName="companyType" required />
            <mat-error *ngIf="form.get('companyType')?.hasError('required')">
              Tip kompanije je obavezan.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Ulica</mat-label>
            <input matInput formControlName="street" required />
            <mat-error *ngIf="form.get('street')?.hasError('required')">
              Ulica je obavezna.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Grad</mat-label>
            <input matInput formControlName="city" required />
            <mat-error *ngIf="form.get('city')?.hasError('required')">
              Grad je obavezan.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Država</mat-label>
            <input matInput formControlName="country" required />
            <mat-error *ngIf="form.get('country')?.hasError('required')">
              Država je obavezna.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Kontakt email</mat-label>
            <input matInput formControlName="contactEmail" type="email" />
            <mat-error *ngIf="form.get('contactEmail')?.hasError('email')">
              Unesite validan email.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Kontakt telefon</mat-label>
            <input matInput formControlName="contactPhone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>PIB</mat-label>
            <input matInput formControlName="PIB" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>MIB</mat-label>
            <input matInput formControlName="MIB" />
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Kreiraj tenant
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .tenant-dialog__content {
        max-width: 860px;
      }

      .tenant-dialog .dialog-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        min-width: 0;
      }
    `,
  ],
})
export class TenantCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<TenantCreateDialogComponent, TenantCreateDialogResult>);
  readonly data = inject<TenantCreateDialogData>(MAT_DIALOG_DATA, { optional: true });

  readonly form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    companyType: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    PIB: [''],
    MIB: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.value as TenantCreateDialogResult);
  }
}


