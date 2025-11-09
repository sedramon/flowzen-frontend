import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminRolesService, AdminRoleQuery } from '../../../services/admin-roles.service';
import { AdminTenantsService } from '../../../services/admin-tenants.service';
import { AdminNotificationsService } from '../../../shared/services/admin-notifications.service';
import { AdminTenant } from '../../../models/admin-tenant.model';
import { Role } from '../../../../../models/Role';
import { AdminUser } from '../../../models/admin-user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface AdminEditUserDialogData {
  user: AdminUser;
}

export interface AdminEditUserDialogResult {
  name?: string;
  role?: string;
  tenantId?: string | null;
  scopes?: string[];
  isGlobalAdmin?: boolean;
}

@Component({
  selector: 'app-admin-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Izmeni korisnika</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="dialog-form">
      <mat-dialog-content>
        <div class="dialog-grid">
          <mat-form-field appearance="outline">
            <mat-label>Ime i prezime</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <div class="role-select">
            <mat-form-field appearance="outline">
              <mat-label>Uloga</mat-label>
              <mat-select formControlName="role">
                @for (role of roles; track role._id) {
                  <mat-option [value]="role._id || role.name">{{ role.name }}</mat-option>
                }
                @if (!roles.length && !loadingRoles) {
                  <mat-option disabled>Nema dostupnih rola</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (loadingRoles) {
              <mat-progress-spinner diameter="24" strokeWidth="3" mode="indeterminate"></mat-progress-spinner>
            }
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Tenant</mat-label>
            <mat-select formControlName="tenantId" [disabled]="form.get('isGlobalAdmin')?.value">
              <mat-option [value]="null">Global</mat-option>
              @for (tenant of tenants; track tenant._id) {
                <mat-option [value]="tenant._id">{{ tenant.name }}</mat-option>
              }
            </mat-select>
            <mat-error *ngIf="form.get('tenantId')?.hasError('required')">
              Tenant je obavezan (osim za superadmina).
            </mat-error>
          </mat-form-field>

          <mat-checkbox formControlName="isGlobalAdmin" (change)="onGlobalAdminToggle()">
            Superadmin
          </mat-checkbox>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Scope-ovi</mat-label>
            <textarea matInput formControlName="scopes" rows="2" placeholder="scope_a, scope_b"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Sačuvaj
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .dialog-form {
        min-width: 520px;
        max-width: 620px;
      }

      .dialog-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        align-items: start;
      }

      .full-width {
        grid-column: 1 / -1;
      }

      .role-select {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    `,
  ],
})
export class AdminEditUserDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(AdminRolesService);
  private readonly tenantsService = inject(AdminTenantsService);
  private readonly notifications = inject(AdminNotificationsService);
  private readonly destroy$ = new Subject<void>();

  readonly dialogRef =
    inject(MatDialogRef<AdminEditUserDialogComponent, AdminEditUserDialogResult>);
  readonly data = inject<AdminEditUserDialogData>(MAT_DIALOG_DATA);

  roles: Role[] = [];
  tenants: AdminTenant[] = [];
  private globalRoles: Role[] = [];
  private tenantRoleCache = new Map<string, Role[]>();
  loadingRoles = false;

  readonly form: FormGroup = this.fb.group(
    {
      name: [''],
      role: [''],
      tenantId: [null],
      isGlobalAdmin: [false],
      scopes: [''],
    },
    { validators: this.validateTenantRequirement },
  );

  ngOnInit(): void {
    this.patchForm();
    this.setupWatchers();
    this.loadTenants();
    this.loadGlobalRoles(() => {
      const tenantId = this.form.get('tenantId')?.value;
      if (this.form.get('isGlobalAdmin')?.value) {
        this.setRoles(this.globalRoles);
      } else {
        this.loadRolesForContext({ tenant: tenantId || undefined });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as {
      name: string | null;
      role: string | null;
      tenantId: string | null;
      isGlobalAdmin: boolean;
      scopes: string;
    };

    const scopes = value.scopes
      ?.split(',')
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);

    this.dialogRef.close({
      name: value.name || undefined,
      role: value.role || undefined,
      tenantId: value.isGlobalAdmin ? null : value.tenantId || undefined,
      scopes: scopes && scopes.length ? scopes : undefined,
      isGlobalAdmin: value.isGlobalAdmin,
    });
  }

  onGlobalAdminToggle(): void {
    const tenantControl = this.form.get('tenantId');
    const isGlobalAdmin = this.form.get('isGlobalAdmin')?.value;

    if (isGlobalAdmin) {
      tenantControl?.disable();
      tenantControl?.setValue(null);
      this.setRoles(this.globalRoles);
    } else {
      tenantControl?.enable();
      const tenantId = tenantControl?.value;
      this.loadRolesForContext({ tenant: tenantId || undefined });
    }
    this.form.updateValueAndValidity();
  }

  private setupWatchers(): void {
    this.form
      .get('tenantId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tenantId) => {
        if (!this.form.get('isGlobalAdmin')?.value) {
          this.loadRolesForContext({ tenant: tenantId || undefined });
        }
      });

    this.form
      .get('isGlobalAdmin')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.onGlobalAdminToggle());
  }

  private patchForm(): void {
    const user = this.data.user;
    this.form.patchValue({
      name: user.name,
      role: typeof user.role === 'string' ? user.role : user.role?._id || user.role?.name || '',
      tenantId: user.tenant?._id || null,
      isGlobalAdmin: user.isGlobalAdmin,
      scopes: user.scopes?.join(', ') || '',
    });

    if (user.isGlobalAdmin) {
      this.form.get('tenantId')?.disable();
    }
  }

  private loadGlobalRoles(onComplete?: () => void): void {
    this.loadingRoles = true;
    this.rolesService
      .findRoles({ type: 'global' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.globalRoles = roles;
          if (this.form.get('isGlobalAdmin')?.value || !this.form.get('tenantId')?.value) {
            this.setRoles(roles);
          }
          this.loadingRoles = false;
          onComplete?.();
        },
        error: (error) => {
          console.error('[AdminEditUserDialog] Failed to load global roles', error);
          this.notifications.error('Greška pri učitavanju globalnih rola.');
          this.loadingRoles = false;
          onComplete?.();
        },
      });
  }

  private loadRolesForContext(query: AdminRoleQuery): void {
    if (!query.tenant) {
      this.setRoles(this.globalRoles);
      return;
    }

    if (this.tenantRoleCache.has(query.tenant)) {
      this.setRoles(this.tenantRoleCache.get(query.tenant) ?? []);
      return;
    }

    this.loadingRoles = true;
    this.rolesService
      .findRoles({ tenant: query.tenant })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.tenantRoleCache.set(query.tenant!, roles);
          this.setRoles(roles);
          this.loadingRoles = false;
        },
        error: (error) => {
          console.error('[AdminEditUserDialog] Failed to load tenant roles', error);
          this.notifications.error('Greška pri učitavanju rola za odabrani tenant.');
          this.loadingRoles = false;
        },
      });
  }

  private setRoles(roles: Role[]): void {
    this.roles = roles;
    const currentRole = this.form.get('role')?.value;
    const roleMatches = roles.some((role) => (role._id ?? role.name) === currentRole);
    if (!roleMatches) {
      this.form.get('role')?.setValue(roles.length ? roles[0]._id ?? roles[0].name : '');
    }
  }

  private loadTenants(): void {
    this.tenantsService
      .listTenants({ page: 1, limit: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tenants = response.items;
        },
        error: (error) => {
          console.error('[AdminEditUserDialog] Failed to load tenants', error);
          this.notifications.error('Greška pri učitavanju tenanata.');
        },
      });
  }

  private validateTenantRequirement(control: FormGroup) {
    const tenantControl = control.get('tenantId');
    const isGlobalAdmin = control.get('isGlobalAdmin')?.value;
    const tenantId = tenantControl?.value;

    if (!isGlobalAdmin && !tenantId) {
      tenantControl?.setErrors({ required: true });
      return { tenantRequired: true };
    }

    if (tenantControl) {
      const errors = { ...(tenantControl.errors || {}) };
      delete errors['required'];
      if (Object.keys(errors).length) {
        tenantControl.setErrors(errors);
      } else {
        tenantControl.setErrors(null);
      }
    }

    return null;
  }
}


