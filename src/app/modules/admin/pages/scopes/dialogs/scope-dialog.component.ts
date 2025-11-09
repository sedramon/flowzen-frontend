import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AdminScope } from '../../../models/admin-scope.model';

export interface ScopeDialogData {
  scope?: AdminScope;
}

export interface ScopeDialogResult {
  name: string;
  description?: string;
  category?: 'tenant' | 'global';
}

@Component({
  selector: 'app-scope-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.scope ? 'Izmeni scope' : 'Novi scope' }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="dialog-form">
      <mat-dialog-content>
        <div class="dialog-grid">
          <mat-form-field appearance="outline">
            <mat-label>Naziv</mat-label>
            <input matInput formControlName="name" required />
            <mat-error *ngIf="form.get('name')?.hasError('required')">
              Naziv je obavezan.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Kategorija</mat-label>
            <mat-select formControlName="category">
              <mat-option value="global">Global</mat-option>
              <mat-option value="tenant">Tenant</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Opis</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.scope ? 'Sačuvaj' : 'Kreiraj' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .dialog-form {
        min-width: 460px;
        max-width: 520px;
      }

      .dialog-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .full-width {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class ScopeDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(MatDialogRef<ScopeDialogComponent, ScopeDialogResult>);
  readonly data = inject<ScopeDialogData>(MAT_DIALOG_DATA) || {};

  readonly form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    category: ['global', Validators.required],
    description: [''],
  });

  constructor() {
    if (this.data.scope) {
      this.form.patchValue({
        name: this.data.scope.name,
        category: this.data.scope.category ?? 'global',
        description: this.data.scope.description ?? '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value as ScopeDialogResult);
  }
}


