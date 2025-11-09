import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { AdminUser } from '../../../models/admin-user.model';

export interface AdminResetPasswordDialogResult {
  password: string;
}

@Component({
  selector: 'app-admin-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Reset lozinke</h2>
    <mat-dialog-content>
      <p class="dialog-description">
        Lozinka za korisnika <strong>{{ data.user.email }}</strong> biće ažurirana.
      </p>
      <form [formGroup]="form" class="dialog-form">
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
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Otkaži</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="form.invalid">
        Sačuvaj
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        width: 100%;
      }

      .full-width {
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


