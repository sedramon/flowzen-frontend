import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { Role } from '../../../../../models/Role';
import { AdminTenant } from '../../../models/admin-tenant.model';
import { AdminScopesService } from '../../../services/admin-scopes.service';
import { AdminScope } from '../../../models/admin-scope.model';

export interface AdminRoleDialogData {
  mode: 'create' | 'edit';
  role?: Role;
  tenants: AdminTenant[];
}

export interface AdminRoleDialogResult {
  name: string;
  type: 'global' | 'tenant';
  tenantId?: string | null;
  availableScopes: string[];
}

interface ScopeBucket {
  key: 'global' | 'tenant';
  label: string;
  scopes: AdminScope[];
}

@Component({
  selector: 'app-admin-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-role-dialog.component.html',
  styleUrl: './admin-role-dialog.component.scss',
})
export class AdminRoleDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly scopesService = inject(AdminScopesService);
  private readonly destroy$ = new Subject<void>();

  readonly dialogRef =
    inject(MatDialogRef<AdminRoleDialogComponent, AdminRoleDialogResult>);
  readonly data = inject<AdminRoleDialogData>(MAT_DIALOG_DATA);

  readonly tenants = this.data.tenants;
  readonly mode = this.data.mode;

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    type: ['global' as 'global' | 'tenant'],
    tenantId: [{ value: null, disabled: true }],
    scopeSearch: [''],
  });

  scopesLoading = false;
  private allScopes: AdminScope[] = [];
  private readonly selectedScopeIds = new Set<string>();
  scopeBuckets: ScopeBucket[] = [];

  ngOnInit(): void {
    this.patchForm();
    this.setupTypeWatcher();
    this.setupSearchWatcher();
    this.refreshBuckets();
    this.loadScopes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isScopeSelected(scopeId: string): boolean {
    return this.selectedScopeIds.has(scopeId);
  }

  selectAll(bucket: ScopeBucket): void {
    bucket.scopes.forEach((scope) => this.selectedScopeIds.add(scope._id));
  }

  clearAll(bucket: ScopeBucket): void {
    bucket.scopes.forEach((scope) => this.selectedScopeIds.delete(scope._id));
  }

  onScopeOptionToggle(scopeId: string, selected: boolean): void {
    if (selected) {
      this.selectedScopeIds.add(scopeId);
      return;
    }
    this.selectedScopeIds.delete(scopeId);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as {
      name: string;
      type: 'global' | 'tenant';
      tenantId: string | null;
    };

    const result: AdminRoleDialogResult = {
      name: value.name.trim(),
      type: value.type,
      tenantId: value.type === 'tenant' ? value.tenantId ?? null : null,
      availableScopes: Array.from(this.selectedScopeIds),
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private patchForm(): void {
    const role = this.data.role;
    if (!role) {
      return;
    }

    const type = role.type ?? (role.tenant ? 'tenant' : 'global');
    const tenantId = role.tenant?._id ?? null;

    this.form.patchValue({
      name: role.name ?? '',
      type,
      tenantId,
    });

    if (type === 'tenant') {
      this.form.get('tenantId')?.enable({ emitEvent: false });
    } else {
      this.form.get('tenantId')?.disable({ emitEvent: false });
    }

    const scopeIds =
      role.availableScopes?.map((scope) =>
        typeof scope === 'string' ? scope : scope._id ?? scope.name,
      ) ?? [];

    scopeIds.filter(Boolean).forEach((id) => this.selectedScopeIds.add(id));
    this.refreshBuckets();
  }

  private setupTypeWatcher(): void {
    this.form
      .get('type')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type: 'global' | 'tenant') => {
        const tenantControl = this.form.get('tenantId');
        if (type === 'tenant') {
          tenantControl?.enable({ emitEvent: false });
        } else {
          tenantControl?.disable({ emitEvent: false });
          tenantControl?.setValue(null, { emitEvent: false });
        }
        this.refreshBuckets();
      });
  }

  private setupSearchWatcher(): void {
    this.form
      .get('scopeSearch')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshBuckets());
  }

  private loadScopes(): void {
    this.scopesLoading = true;
    this.scopesService
      .listScopes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scopes: AdminScope[]) => {
          this.allScopes = scopes;
          this.scopesLoading = false;
          this.refreshBuckets();
        },
        error: (error: unknown) => {
          console.error('[AdminRoleDialog] Failed to load scopes', error);
          this.scopesLoading = false;
        },
      });
  }

  private refreshBuckets(): void {
    const search = (this.form.get('scopeSearch')?.value as string)?.trim().toLowerCase() ?? '';
    const type = this.form.get('type')?.value as 'global' | 'tenant';

    const matchesSearch = (scope: AdminScope) => {
      if (!search) return true;
      return (
        scope.name.toLowerCase().includes(search) ||
        scope.description?.toLowerCase().includes(search)
      );
    };

    const buckets: ScopeBucket[] = [
      { key: 'global', label: 'Globalni scope-ovi', scopes: [] },
      { key: 'tenant', label: 'Tenant scope-ovi', scopes: [] },
    ];

    this.allScopes.forEach((scope) => {
      if (!matchesSearch(scope)) {
        return;
      }

      const bucketKey = (scope.category ?? 'tenant') as 'global' | 'tenant';
      if (type === 'global' && bucketKey === 'tenant') {
        return;
      }

      const bucket = buckets.find((b) => b.key === bucketKey);
      bucket?.scopes.push(scope);
    });

    this.scopeBuckets = buckets.filter((bucket) => bucket.scopes.length > 0);
  }
}

