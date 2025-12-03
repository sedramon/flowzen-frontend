import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntil, debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { AdminRolesService } from '../../services/admin-roles.service';
import { AdminTenantsService } from '../../services/admin-tenants.service';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';
import { AdminTenant } from '../../models/admin-tenant.model';
import { AdminPagination } from '../../models/pagination';
import { Role } from '../../../../models/Role';
import {
  AdminRoleDialogComponent,
  AdminRoleDialogData,
  AdminRoleDialogResult,
} from './dialogs/admin-role-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/dialogs/confirm-dialog.component';

interface RoleGroupView {
  key: 'global' | 'tenant';
  label: string;
  description: string;
  icon: string;
  roles: Role[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.scss',
})
export class AdminRolesComponent implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(AdminRolesService);
  private readonly tenantsService = inject(AdminTenantsService);
  private readonly notifications = inject(AdminNotificationsService);

  readonly filterForm: FormGroup = this.fb.group({
    search: [''],
    type: ['all'],
    tenant: [null],
  });

  loading = false;
  tenantsLoading = false;
  creatingRole = false;
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  roleGroups: RoleGroupView[] = [];
  tenants: AdminTenant[] = [];
  private readonly processingRoles = new Set<string>();
  private currentType: 'all' | 'global' | 'tenant' = 'all';
  private currentTenant: string | null = null;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadTenants();
    this.loadRoles();

    const typeControl = this.filterForm.get('type');
    const tenantControl = this.filterForm.get('tenant');

    typeControl
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type: 'all' | 'global' | 'tenant') => {
        if (type === 'global') {
          tenantControl?.disable({ emitEvent: false });
          tenantControl?.setValue(null, { emitEvent: false });
        } else {
          tenantControl?.enable({ emitEvent: false });
        }
      });

    if (typeControl?.value === 'global') {
      tenantControl?.disable({ emitEvent: false });
    }

    this.filterForm.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        const type = this.filterForm.value['type'] as 'all' | 'global' | 'tenant';
        const tenant = (this.filterForm.value['tenant'] as string | null) ?? null;

        if (type !== this.currentType || tenant !== this.currentTenant) {
          this.loadRoles();
        } else {
          this.applyFilters();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  refresh(): void {
    this.loadRoles(true);
  }

  isProcessing(roleId: string): boolean {
    return this.processingRoles.has(roleId);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<
      AdminRoleDialogComponent,
      AdminRoleDialogData,
      AdminRoleDialogResult
    >(AdminRoleDialogComponent, {
      width: '760px',
      maxWidth: '90vw',
      panelClass: 'admin-dialog-panel',
      data: {
        mode: 'create',
        tenants: this.tenants,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.createRole(result);
      }
    });
  }

  openEditDialog(role: Role): void {
    const dialogRef = this.dialog.open<
      AdminRoleDialogComponent,
      AdminRoleDialogData,
      AdminRoleDialogResult
    >(AdminRoleDialogComponent, {
      width: '760px',
      maxWidth: '90vw',
      panelClass: 'admin-dialog-panel',
      data: {
        mode: 'edit',
        role,
        tenants: this.tenants,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.updateRole(role._id as string, result);
      }
    });
  }

  confirmDelete(role: Role): void {
    if (!role._id) {
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '520px',
        maxWidth: '92vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
        data: {
          title: 'Obriši rolu',
          description: `Potvrdi brisanje role <strong>${role.name}</strong>. Ova akcija je nepovratna.`,
          confirmLabel: 'Obriši',
          confirmColor: 'warn',
        },
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteRole(role._id as string);
      }
    });
  }

  private loadRoles(force = false): void {
    if (this.loading && !force) {
      return;
    }
    this.loading = true;

    const type = this.filterForm.value['type'];
    const tenant = this.filterForm.value['tenant'];
    const query: { tenant?: string | null; type?: 'global' | 'tenant' } = {};

    if (type === 'global') {
      query.type = 'global';
    } else if (type === 'tenant') {
      query.type = 'tenant';
      if (tenant) {
        query.tenant = tenant;
      }
    } else if (tenant) {
      query.tenant = tenant;
    }

    this.rolesService
      .findRoles(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles: Role[]) => {
          this.roles = roles;
          this.applyFilters();
          this.currentType = type as 'all' | 'global' | 'tenant';
          this.currentTenant = (tenant as string | null) ?? null;
          this.creatingRole = false;
          this.loading = false;
        },
        error: (error: unknown) => {
          this.logError('[AdminRolesComponent] Failed to load roles', error);
          this.notifications.error('Greška pri učitavanju rola.');
          this.creatingRole = false;
          this.loading = false;
        },
      });
  }

  private loadTenants(): void {
    this.tenantsLoading = true;
    this.tenantsService
      .listTenants({ page: 1, limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AdminPagination<AdminTenant>) => {
          this.tenants = response.items;
          this.tenantsLoading = false;
        },
        error: (error: unknown) => {
          this.logError('[AdminRolesComponent] Failed to load tenants', error);
          this.notifications.error('Greška pri učitavanju tenanata.');
          this.tenantsLoading = false;
        },
      });
  }

  private applyFilters(): void {
    const search = (this.filterForm.value['search'] as string)?.trim().toLowerCase() ?? '';
    const typeFilter = this.filterForm.value['type'] as 'all' | 'global' | 'tenant';
    const tenantFilter = this.filterForm.value['tenant'] as string | null;

    const matchesSearch = (role: Role): boolean => {
      if (!search) return true;
      const tokens = [
        role.name,
        role.type,
        role.tenant?.name ?? '',
        ...(role.availableScopes?.map((scope) => (typeof scope === 'string' ? scope : scope.name)) ??
          []),
      ];
      return tokens.some((token) => token?.toLowerCase().includes(search));
    };

    const matchesTenant = (role: Role): boolean => {
      if (!tenantFilter) return true;
      if (role.type === 'global') {
        return false;
      }
      return role.tenant?._id === tenantFilter;
    };

    this.filteredRoles = this.roles.filter((role) => matchesSearch(role) && matchesTenant(role));

    if (typeFilter !== 'all') {
      this.filteredRoles = this.filteredRoles.filter((role) => role.type === typeFilter);
    }

    const groups: RoleGroupView[] = [];

    const groupMeta: Record<'global' | 'tenant', { label: string; description: string; icon: string }> =
      {
        global: {
          label: 'Globalne role',
          description: 'Dostupne u svim tenantima; oblikuju globalne privilegije.',
          icon: 'public',
        },
        tenant: {
          label: 'Tenant role',
          description: 'Specifične za poslovne jedinice; kombinuj sa tenant adminima.',
          icon: 'business',
        },
      };

    (['global', 'tenant'] as Array<'global' | 'tenant'>).forEach((key) => {
      const roles = this.filteredRoles.filter((role) => role.type === key);
      if ((typeFilter === 'all' || typeFilter === key) && roles.length) {
        const meta = groupMeta[key];
        groups.push({
          key,
          label: meta.label,
          description: meta.description,
          icon: meta.icon,
          roles,
        });
      }
    });

    this.roleGroups = groups;
  }

  private createRole(payload: AdminRoleDialogResult): void {
    this.creatingRole = true;
    this.loading = true;
    this.rolesService
      .createRole({
        name: payload.name,
        availableScopes: payload.availableScopes,
        tenant: payload.type === 'tenant' ? payload.tenantId ?? null : null,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Rola je kreirana.');
          this.loadRoles(true);
        },
        error: (error: unknown) => {
          this.logError('[AdminRolesComponent] Failed to create role', error);
          this.notifications.error('Kreiranje role nije uspelo.');
          this.creatingRole = false;
          this.loading = false;
        },
      });
  }

  private updateRole(roleId: string, payload: AdminRoleDialogResult): void {
    this.processingRoles.add(roleId);
    
    const updatePayload: any = {
      availableScopes: payload.availableScopes || [],
    };
    
    if (payload.name) {
      updatePayload.name = payload.name;
    }
    
    if (payload.type === 'tenant' && payload.tenantId) {
      updatePayload.tenant = payload.tenantId;
    } else if (payload.type === 'global') {
      // For global roles, we might need to set tenant to null or omit it
      // Check backend requirements
    }
    
    console.log('[AdminRolesComponent] Updating role with payload:', updatePayload);
    
    this.rolesService
      .updateRole(roleId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRole) => {
          console.log('[AdminRolesComponent] Role updated successfully:', updatedRole);
          this.notifications.success('Rola je ažurirana.');
          this.processingRoles.delete(roleId);
          this.loadRoles(true);
        },
        error: (error: unknown) => {
          console.error('[AdminRolesComponent] Failed to update role', error);
          this.logError('[AdminRolesComponent] Failed to update role', error);
          this.notifications.error('Ažuriranje role nije uspelo.');
          this.processingRoles.delete(roleId);
        },
      });
  }

  private deleteRole(roleId: string): void {
    this.processingRoles.add(roleId);
    this.rolesService
      .deleteRole(roleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Rola je obrisana.');
          this.processingRoles.delete(roleId);
          this.loadRoles(true);
        },
        error: (error: unknown) => {
          this.logError('[AdminRolesComponent] Failed to delete role', error);
          this.notifications.error('Brisanje role nije uspelo.');
          this.processingRoles.delete(roleId);
        },
      });
  }

  isProcessingRole(role: Role): boolean {
    return !!role._id && this.processingRoles.has(role._id);
  }

  private logError(context: string, error: unknown): void {
    if (error instanceof Error) {
      console.error(context, error);
    } else {
      console.error(context, String(error));
    }
  }
}

