import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  AdminTenantsService,
  AdminTenantQuery,
} from '../../services/admin-tenants.service';
import { AdminTenant, TenantStatus } from '../../models/admin-tenant.model';
import { AdminPagination } from '../../models/pagination';
import {
  TenantCreateDialogComponent,
  TenantCreateDialogResult,
} from './dialogs/tenant-create-dialog.component';
import {
  TenantLicenseDialogComponent,
  TenantLicenseDialogData,
  TenantLicenseDialogResult,
} from './dialogs/tenant-license-dialog.component';
import {
  TenantSuspendDialogComponent,
  TenantSuspendDialogData,
  TenantSuspendDialogResult,
} from './dialogs/tenant-suspend-dialog.component';
import {
  TenantActivateDialogComponent,
  TenantActivateDialogData,
  TenantActivateDialogResult,
} from './dialogs/tenant-activate-dialog.component';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';

interface TenantFilterChip {
  label: string;
  icon: string;
  status?: TenantStatus;
}

@Component({
  selector: 'app-admin-tenants',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './admin-tenants.component.html',
  styleUrl: './admin-tenants.component.scss',
})
export class AdminTenantsComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  readonly tenantFilters: TenantFilterChip[] = [
    { label: 'All tenants', icon: 'view_module' },
    { label: 'Active', icon: 'verified', status: 'active' },
    { label: 'Suspended', icon: 'report', status: 'suspended' },
    { label: 'Pending', icon: 'hourglass_empty', status: 'pending' },
  ];

  loading = false;
  tenants: AdminTenant[] = [];
  pagination: AdminPagination<AdminTenant> | null = null;
  processingTenants = new Set<string>();

  private readonly destroy$ = new Subject<void>();
  activeStatus: TenantStatus | undefined;

  constructor(
    private readonly fb: FormBuilder,
    private readonly tenantsService: AdminTenantsService,
    private readonly notifications: AdminNotificationsService,
    private readonly dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.loadTenants({});

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.activeStatus = (value.status as TenantStatus | undefined) || undefined;
        this.loadTenants({
          search: value.search,
          status: this.activeStatus,
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyChip(chip: TenantFilterChip): void {
    this.activeStatus = chip.status;
    this.filterForm.patchValue(
      {
        status: chip.status ?? '',
      },
      { emitEvent: false },
    );
    this.loadTenants({
      search: this.filterForm.value.search,
      status: chip.status,
    });
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  refresh(): void {
    this.loadTenants({
      search: this.filterForm.value.search,
      status: this.activeStatus,
    });
  }

  trackByTenantId(_index: number, tenant: AdminTenant): string {
    return tenant._id;
  }

  openCreateTenantDialog(): void {
    const dialogRef = this.dialog.open<TenantCreateDialogComponent, undefined, TenantCreateDialogResult>(
      TenantCreateDialogComponent,
      {
        width: '520px',
        disableClose: true,
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.createTenant(result);
      }
    });
  }

  openLicenseDialog(tenant: AdminTenant): void {
    const dialogRef = this.dialog.open<
      TenantLicenseDialogComponent,
      TenantLicenseDialogData,
      TenantLicenseDialogResult
    >(TenantLicenseDialogComponent, {
      width: '480px',
      disableClose: true,
      data: {
        hasActiveLicense: tenant.hasActiveLicense ?? false,
        licenseStartDate: tenant.licenseStartDate ?? null,
        licenseExpiryDate: tenant.licenseExpiryDate ?? null,
      },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.updateLicense(tenant._id, result);
      }
    });
  }

  openSuspendDialog(tenant: AdminTenant): void {
    const dialogRef = this.dialog.open<
      TenantSuspendDialogComponent,
      TenantSuspendDialogData,
      TenantSuspendDialogResult
    >(TenantSuspendDialogComponent, {
      width: '460px',
      disableClose: true,
      data: { name: tenant.name },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.suspendTenant(tenant._id, result);
      }
    });
  }

  openActivateDialog(tenant: AdminTenant): void {
    const dialogRef = this.dialog.open<
      TenantActivateDialogComponent,
      TenantActivateDialogData,
      TenantActivateDialogResult
    >(TenantActivateDialogComponent, {
      width: '460px',
      disableClose: true,
      data: { name: tenant.name },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.activateTenant(tenant._id, result);
      }
    });
  }

  isProcessing(tenantId: string): boolean {
    return this.processingTenants.has(tenantId);
  }

  private loadTenants(query: AdminTenantQuery): void {
    this.loading = true;

    this.tenantsService
      .listTenants({
        page: 1,
        limit: 12,
        ...query,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tenants = response.items;
          this.pagination = response;
          this.processingTenants.clear();
          this.loading = false;
        },
        error: (error) => {
          console.error('[AdminTenantsComponent] Failed to load tenants', error);
          this.notifications.error('Greška pri učitavanju tenanata.');
          this.loading = false;
        },
      });
  }

  private createTenant(payload: TenantCreateDialogResult): void {
    this.loading = true;
    this.tenantsService
      .createTenant(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Tenant je uspešno kreiran.');
          this.refreshAfterAction();
        },
        error: (error) => {
          console.error('[AdminTenantsComponent] Failed to create tenant', error);
          this.notifications.error('Kreiranje tenanta nije uspelo.');
          this.loading = false;
        },
      });
  }

  private updateLicense(tenantId: string, payload: TenantLicenseDialogResult): void {
    this.processingTenants.add(tenantId);
    this.tenantsService
      .updateLicense(tenantId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Licenca je ažurirana.');
          this.refreshAfterAction();
        },
        error: (error) => {
          console.error('[AdminTenantsComponent] Failed to update license', error);
          this.notifications.error('Ažuriranje licence nije uspelo.');
          this.processingTenants.delete(tenantId);
        },
      });
  }

  private suspendTenant(tenantId: string, payload: TenantSuspendDialogResult): void {
    this.processingTenants.add(tenantId);
    this.tenantsService
      .suspendTenant(tenantId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.info('Tenant je suspendovan.');
          this.refreshAfterAction();
        },
        error: (error) => {
          console.error('[AdminTenantsComponent] Failed to suspend tenant', error);
          this.notifications.error('Suspenzija tenanta nije uspela.');
          this.processingTenants.delete(tenantId);
        },
      });
  }

  private activateTenant(tenantId: string, payload: TenantActivateDialogResult): void {
    this.processingTenants.add(tenantId);
    this.tenantsService
      .activateTenant(tenantId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Tenant je aktiviran.');
          this.refreshAfterAction();
        },
        error: (error) => {
          console.error('[AdminTenantsComponent] Failed to activate tenant', error);
          this.notifications.error('Aktivacija tenanta nije uspela.');
          this.processingTenants.delete(tenantId);
        },
      });
  }

  private refreshAfterAction(): void {
    this.loadTenants({
      search: this.filterForm.value.search,
      status: this.activeStatus,
    });
    this.processingTenants.clear();
  }

  formatValue(value: string | null | undefined): string {
    return value && value.trim().length ? value : '—';
  }

  formatAddress(tenant: AdminTenant): string {
    const segments = [tenant.street, tenant.city, tenant.country].filter(
      (part): part is string => !!part && part.trim().length > 0,
    );
    return segments.length ? segments.join(', ') : '—';
  }

  formatTaxNumbers(tenant: AdminTenant): string {
    const parts = [tenant.PIB, tenant.MIB].filter(
      (value): value is string => !!value && value.trim().length > 0,
    );
    return parts.length ? parts.join(' / ') : '—';
  }
}

