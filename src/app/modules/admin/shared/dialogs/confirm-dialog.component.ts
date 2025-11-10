import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="admin-dialog admin-dialog--confirm confirm-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>{{ data.title }}</h2>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content">
        <p class="confirm-dialog__description" [innerHTML]="data.description"></p>
      </mat-dialog-content>

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button (click)="dialogRef.close(false)">
          {{ data.cancelLabel || 'Otkaži' }}
        </button>
        <button mat-flat-button [color]="data.confirmColor || 'primary'" (click)="dialogRef.close(true)">
          {{ data.confirmLabel || 'Potvrdi' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .confirm-dialog {
        width: min(440px, calc(100vw - 48px));
      }

      .confirm-dialog__description {
        margin: 0;
        font-size: 0.95rem;
        color: rgba(234, 237, 255, 0.82);
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  get icon(): string {
    if (this.data.confirmColor === 'warn') {
      return 'warning';
    }
    if (this.data.confirmColor === 'accent') {
      return 'help';
    }
    return 'task_alt';
  }
}


