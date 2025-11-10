import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="admin-dialog admin-dialog--audit audit-detail-dialog">
      <header class="admin-dialog__header">
        <div class="admin-dialog__icon">
          <mat-icon>data_object</mat-icon>
        </div>
        <div class="admin-dialog__title">
          <h2>Detalji audit loga</h2>
          <p>Pregled kompletnih metapodataka za odabrani audit događaj.</p>
        </div>
      </header>

      <mat-dialog-content class="admin-dialog__content">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">Akcija</span>
            <span class="value">{{ data.action }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Izvršio</span>
            <span class="value">{{ data.actor }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Tenant</span>
            <span class="value">{{ data.tenant }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Vreme</span>
            <span class="value">{{ data.timestamp }}</span>
          </div>
        </div>

        <section class="metadata">
          <span class="label">Metadata</span>
          <pre>{{ formattedMetadata }}</pre>
        </section>
      </mat-dialog-content>

      <mat-dialog-actions class="admin-dialog__actions" align="end">
        <button mat-button (click)="dialogRef.close()">Zatvori</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .audit-detail-dialog {
        width: min(560px, calc(100vw - 48px));
      }

      .detail-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: 1fr 1fr;
      }

      .detail-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .label {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.62);
      }

      .value {
        font-size: 0.95rem;
        color: rgba(239, 244, 255, 0.92);
        word-break: break-word;
      }

      .metadata {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }

      .metadata pre {
        max-height: 280px;
        overflow: auto;
        background: rgba(8, 10, 18, 0.65);
        padding: 14px;
        border-radius: 12px;
        color: #c5e1f5;
        font-size: 0.85rem;
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


