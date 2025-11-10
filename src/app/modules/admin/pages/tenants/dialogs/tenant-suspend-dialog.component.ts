import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TenantSuspendDialogData {
  name: string;
}

export interface TenantSuspendDialogResult {
  reason?: string;
}

@Component({
  selector: 'app-tenant-suspend-dialog',
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
    <form [formGroup]="form" (ngSubmit)="confirm()" class="admin-dialog admin-dialog--tenants tenant-suspend-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>block</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>Suspenduj tenant</h2>
          <p>
            Suspenzija privremeno onemogućava pristup korisnicima tenanta
            <strong>{{ data.name }}</strong>. Možeš je opozvati kasnije.
          </p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content tenant-suspend-dialog__content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razlog (opciono)</mat-label>
          <textarea matInput rows="4" formControlName="reason"></textarea>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="warn" type="submit">Potvrdi suspenziju</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .tenant-suspend-dialog__content {
        max-width: 720px;
      }

      .tenant-suspend-dialog .full-width {
        width: 100%;
      }
    `,
  ],
})
export class TenantSuspendDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef =
    inject(MatDialogRef<TenantSuspendDialogComponent, TenantSuspendDialogResult>);
  readonly data = inject<TenantSuspendDialogData>(MAT_DIALOG_DATA);

  readonly form: FormGroup = this.fb.group({
    reason: [''],
  });

  confirm(): void {
    const { reason } = this.form.value;
    this.dialogRef.close({ reason: reason || undefined });
  }
}


