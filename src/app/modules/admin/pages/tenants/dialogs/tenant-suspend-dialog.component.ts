import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface TenantSuspendDialogData {
  name: string;
}

export interface TenantSuspendDialogResult {
  reason?: string;
}

@Component({
  selector: 'app-tenant-suspend-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Suspenduj tenant</h2>
    <mat-dialog-content>
      <p class="dialog-description">
        Potvrdi suspenziju za <strong>{{ data.name }}</strong>. Korisnici ovog tenanta neće moći da se prijave dok ga ponovo ne aktiviraš.
      </p>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razlog (opciono)</mat-label>
          <textarea matInput rows="4" formControlName="reason"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Otkaži</button>
      <button mat-flat-button color="warn" (click)="confirm()">Potvrdi suspenziju</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-description {
        margin-bottom: 20px;
      }

      .dialog-form {
        width: 100%;
      }

      .full-width {
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


