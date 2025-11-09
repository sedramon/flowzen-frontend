import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface TenantActivateDialogData {
  name: string;
}

export interface TenantActivateDialogResult {
  note?: string;
}

@Component({
  selector: 'app-tenant-activate-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Aktiviraj tenant</h2>
    <mat-dialog-content>
      <p class="dialog-description">
        Tenant <strong>{{ data.name }}</strong> će biti ponovo aktivan i korisnici će moći da nastave sa radom.
      </p>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Napomena (opciono)</mat-label>
          <textarea matInput rows="4" formControlName="note"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Otkaži</button>
      <button mat-flat-button color="primary" (click)="confirm()">Aktiviraj</button>
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


