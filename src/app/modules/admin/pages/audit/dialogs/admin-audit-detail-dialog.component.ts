import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface AdminAuditDetailDialogData {
  action: string;
  actor: string;
  tenant: string;
  timestamp: string;
  metadata: Record<string, unknown> | string | null;
}

@Component({
  selector: 'app-admin-audit-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Detalji audit loga</h2>
    <mat-dialog-content class="dialog-content">
      <div class="meta-row">
        <span class="label">Akcija:</span>
        <span class="value">{{ data.action }}</span>
      </div>
      <div class="meta-row">
        <span class="label">Izvršio:</span>
        <span class="value">{{ data.actor }}</span>
      </div>
      <div class="meta-row">
        <span class="label">Tenant:</span>
        <span class="value">{{ data.tenant }}</span>
      </div>
      <div class="meta-row">
        <span class="label">Vreme:</span>
        <span class="value">{{ data.timestamp }}</span>
      </div>
      <div class="metadata">
        <span class="label">Metadata:</span>
        <pre>{{ formattedMetadata }}</pre>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Zatvori</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 480px;
        max-width: 640px;
      }

      .meta-row {
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .label {
        font-weight: 600;
        color: rgba(79, 195, 247, 0.9);
      }

      .value {
        color: #e3f2fd;
      }

      .metadata pre {
        max-height: 260px;
        overflow: auto;
        background: rgba(9, 11, 19, 0.65);
        padding: 14px;
        border-radius: 12px;
        color: #c5e1f5;
      }
    `,
  ],
})
export class AdminAuditDetailDialogComponent {
  readonly data = inject<AdminAuditDetailDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AdminAuditDetailDialogComponent>);

  get formattedMetadata(): string {
    if (!this.data.metadata) {
      return '—';
    }
    if (typeof this.data.metadata === 'string') {
      return this.data.metadata;
    }
    return JSON.stringify(this.data.metadata, null, 2);
  }
}


