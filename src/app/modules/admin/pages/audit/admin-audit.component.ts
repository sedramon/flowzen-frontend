import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AdminAuditService } from '../../services/admin-audit.service';
import { AdminAuditLog } from '../../models/admin-audit-log.model';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';
import {
  AdminAuditDetailDialogComponent,
  AdminAuditDetailDialogData,
} from './dialogs/admin-audit-detail-dialog.component';

interface AuditEventView {
  actor: string;
  action: string;
  tenant: string;
  scope: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  metadata: string;
  rawMetadata: Record<string, unknown> | string | null;
  rawLog: AdminAuditLog;
}

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './admin-audit.component.html',
  styleUrl: './admin-audit.component.scss',
})
export class AdminAuditComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  loading = false;
  events: AuditEventView[] = [];
  private rawLogs: AdminAuditLog[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly auditService: AdminAuditService,
    private readonly notifications: AdminNotificationsService,
    private readonly dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      targetType: [''],
      severity: [''],
      timeRange: ['24h'],
      limit: [25],
      startDate: [null],
      endDate: [null],
    });
  }

  ngOnInit(): void {
    this.loadLogs();

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.loadLogs();
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  onTimeRangeChange(): void {
    const timeRange = this.filterForm.value.timeRange;
    if (timeRange !== 'custom') {
      this.filterForm.patchValue(
        {
          startDate: null,
          endDate: null,
        },
        { emitEvent: false },
      );
    }
    this.refresh();
  }

  onLimitChange(): void {
    this.refresh();
  }

  openDetailDialog(event: AuditEventView, rawMetadata: Record<string, unknown> | string | null): void {
    const data: AdminAuditDetailDialogData = {
      action: event.action,
      actor: event.actor,
      tenant: event.tenant,
      timestamp: event.timestamp,
      metadata: rawMetadata,
    };

    this.dialog.open(AdminAuditDetailDialogComponent, {
      width: '680px',
      maxWidth: '92vw',
      panelClass: 'admin-dialog-panel',
      data,
    });
  }

  exportJson(): void {
    const blob = new Blob([JSON.stringify(this.rawLogs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-log-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.notifications.info('Audit log je eksportovan kao JSON.');
  }

  private loadLogs(): void {
    this.loading = true;

    const filters = this.filterForm.value;
    const query: any = {
      page: 1,
      limit: filters.limit || 25,
    };

    if (filters.timeRange && filters.timeRange !== 'custom') {
      query.timeRange = filters.timeRange;
    }

    if (filters.timeRange === 'custom') {
      if (!filters.startDate || !filters.endDate) {
        this.notifications.error('Za custom opseg potrebni su početni i krajnji datum.');
        this.loading = false;
        return;
      }
      query.startDate = new Date(filters.startDate).toISOString();
      query.endDate = new Date(filters.endDate).toISOString();
    }

    this.auditService
      .listLogs(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.rawLogs = response.items;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('[AdminAuditComponent] Failed to load audit logs', error);
          this.notifications.error('Greška pri učitavanju audit logova.');
          this.loading = false;
        },
      });
  }

  private applyFilters(): void {
    const { search, targetType, severity } = this.filterForm.value;
    const normalizedSearch = (search as string)?.toLowerCase().trim() ?? '';
    const normalizedTarget = (targetType as string)?.toLowerCase().trim() ?? '';
    const normalizedSeverity = (severity as string)?.toLowerCase().trim() ?? '';

    const results: AuditEventView[] = [];

    for (const log of this.rawLogs) {
      const event = this.mapToView(log);

      const matchesSearch =
        !normalizedSearch ||
        event.action.toLowerCase().includes(normalizedSearch) ||
        event.metadata.toLowerCase().includes(normalizedSearch) ||
        event.actor.toLowerCase().includes(normalizedSearch) ||
        event.tenant.toLowerCase().includes(normalizedSearch);

      const matchesTarget =
        !normalizedTarget ||
        (log.targetType ? log.targetType.toLowerCase() === normalizedTarget : false);

      const matchesSeverity =
        !normalizedSeverity || event.severity === (normalizedSeverity as AuditEventView['severity']);

      if (matchesSearch && matchesTarget && matchesSeverity) {
        results.push(event);
      }
    }

    this.events = results;
  }

  private mapToView(log: AdminAuditLog): AuditEventView {
    const performedBy =
      typeof log.performedBy === 'string'
        ? log.performedBy
        : log.performedBy?.name || log.performedBy?.email || 'System';

    const tenant = log.tenant?.name || 'Global';
    const metadataString = log.metadata ? JSON.stringify(log.metadata) : '—';

    return {
      actor: performedBy,
      action: log.action,
      tenant,
      scope: log.targetType ?? 'N/A',
      timestamp: new Date(log.createdAt).toLocaleString(),
      severity: this.resolveSeverity(log.action),
      metadata: metadataString,
      rawMetadata: log.metadata ?? null,
      rawLog: log,
    };
  }

  private resolveSeverity(action: string): 'info' | 'warning' | 'critical' {
    if (action.includes('delete') || action.includes('suspend') || action.includes('rollback')) {
      return 'critical';
    }
    if (action.includes('update') || action.includes('activate')) {
      return 'warning';
    }
    return 'info';
  }
}

