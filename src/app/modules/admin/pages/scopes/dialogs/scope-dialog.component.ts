import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="admin-dialog admin-dialog--scopes scope-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>tune</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>{{ data.scope ? 'Izmeni scope' : 'Novi scope' }}</h2>
          <p>Definiši naziv, kategoriju i opis scope definicije za granularnu kontrolu pristupa.</p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content scope-dialog__content">
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

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ data.scope ? 'Sačuvaj' : 'Kreiraj' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .scope-dialog__content {
        max-width: 860px;
      }

      .scope-dialog .dialog-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        min-width: 0;
      }

      .scope-dialog .full-width {
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


