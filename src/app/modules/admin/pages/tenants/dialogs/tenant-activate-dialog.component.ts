import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TenantActivateDialogData {
  name: string;
}

export interface TenantActivateDialogResult {
  note?: string;
}

@Component({
  selector: 'app-tenant-activate-dialog',
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
    <form [formGroup]="form" (ngSubmit)="confirm()" class="admin-dialog admin-dialog--tenants tenant-activate-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>restart_alt</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>Aktiviraj tenant</h2>
          <p>
            Tenant <strong>{{ data.name }}</strong> će biti ponovo aktivan i korisnici će se moći prijaviti.
          </p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Napomena (opciono)</mat-label>
          <textarea matInput rows="4" formControlName="note"></textarea>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit">Aktiviraj</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .tenant-activate-dialog {
        // width: 100%;
      }

      .tenant-activate-dialog .full-width {
        width: 100%;
      }
    `,
  ],
})
export class TenantActivateDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef =
    inject(MatDialogRef<TenantActivateDialogComponent, TenantActivateDialogResult>);
  readonly data = inject<TenantActivateDialogData>(MAT_DIALOG_DATA);

  readonly form: FormGroup = this.fb.group({
    note: [''],
  });

  confirm(): void {
    const { note } = this.form.value;
    this.dialogRef.close({ note: note || undefined });
  }
}


