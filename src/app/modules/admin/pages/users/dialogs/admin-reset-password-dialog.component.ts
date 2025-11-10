import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AdminUser } from '../../../models/admin-user.model';

export interface AdminResetPasswordDialogResult {
  password: string;
}

@Component({
  selector: 'app-admin-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="confirm()" class="admin-dialog admin-dialog--users reset-password-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>vpn_key</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>Reset lozinke</h2>
          <p>Postavi novu lozinku za korisnika <strong>{{ data.user.email }}</strong>.</p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nova lozinka</mat-label>
          <input matInput type="password" formControlName="password" required />
          <mat-error *ngIf="form.controls['password'].hasError('required')">
            Lozinka je obavezna.
          </mat-error>
          <mat-error *ngIf="form.controls['password'].hasError('minlength')">
            Minimalno 8 karaktera.
          </mat-error>
        </mat-form-field>
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
      .reset-password-dialog .admin-dialog__content {
        max-width: 520px;
      }

      .reset-password-dialog .full-width {
        width: 100%;
      }
    `,
  ],
})
export class AdminResetPasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef =
    inject(MatDialogRef<AdminResetPasswordDialogComponent, AdminResetPasswordDialogResult>);
  readonly data = inject<{ user: AdminUser }>(MAT_DIALOG_DATA) || { user: {} as AdminUser };

  readonly form: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({ password: this.form.value['password'] });
  }
}


