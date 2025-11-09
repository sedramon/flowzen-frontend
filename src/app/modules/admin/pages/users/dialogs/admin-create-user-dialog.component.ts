import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
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
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface AdminCreateUserDialogResult {
  name?: string;
  email: string;
  password: string;
  role: string;
  tenantId?: string | null;
  scopes?: string[];
  isGlobalAdmin?: boolean;
}

@Component({
  selector: 'app-admin-create-user-dialog',
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
    <h2 mat-dialog-title>Novi korisnik</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" class="dialog-form">
      <mat-dialog-content>
        <div class="dialog-grid">
          <mat-form-field appearance="outline">
            <mat-label>Ime i prezime</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" required />
          <mat-error *ngIf="form.get('email')?.hasError('required')">
              Email je obavezan.
            </mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">
              Unesite validan email.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lozinka</mat-label>
            <input matInput type="password" formControlName="password" required />
          <mat-error *ngIf="form.get('password')?.hasError('required')">
              Lozinka je obavezna.
            </mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">
              Minimalno 8 karaktera.
            </mat-error>
          </mat-form-field>

          <div class="role-select">
            <mat-form-field appearance="outline">
              <mat-label>Uloga</mat-label>
              <mat-select formControlName="role" required>
                @for (role of roles; track role._id) {
                  <mat-option [value]="role._id || role.name">{{ role.name }}</mat-option>
                }
                @if (!roles.length && !loadingRoles) {
                  <mat-option disabled> Nema dostupnih rola </mat-option>
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

          <mat-checkbox formControlName="isGlobalAdmin" (change)="onGlobalAdminToggle()">Superadmin</mat-checkbox>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Scope-ovi (opciono, razdvojeni zarezom)</mat-label>
            <textarea matInput formControlName="scopes" rows="2" placeholder="scope_a, scope_b"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Otkaži</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Kreiraj
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .dialog-form {
        min-width: 520px;
        max-width: 640px;
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
export class AdminCreateUserDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(AdminRolesService);
  private readonly tenantsService = inject(AdminTenantsService);
  private readonly notifications = inject(AdminNotificationsService);
  private readonly destroy$ = new Subject<void>();

  readonly dialogRef =
    inject(MatDialogRef<AdminCreateUserDialogComponent, AdminCreateUserDialogResult>);
  readonly data = inject<any>(MAT_DIALOG_DATA, { optional: true });

  roles: Role[] = [];
  tenants: AdminTenant[] = [];
  private globalRoles: Role[] = [];
  private tenantRoleCache = new Map<string, Role[]>();
  loadingRoles = false;

  readonly form: FormGroup = this.fb.group(
    {
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['', Validators.required],
      tenantId: [null],
      isGlobalAdmin: [false],
      scopes: [''],
    },
    { validators: this.validateTenantRequirement },
  );

  ngOnInit(): void {
    this.loadTenants();
    this.loadGlobalRoles();

    this.form
      .get('tenantId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((tenantId) => {
        if (!this.form.get('isGlobalAdmin')?.value) {
          this.loadRolesForContext({ tenant: tenantId || undefined, type: tenantId ? undefined : 'tenant' });
        }
      });

    this.form
      .get('isGlobalAdmin')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((isGlobal) => {
        this.onGlobalAdminToggle();
        if (isGlobal) {
          this.setRoles(this.globalRoles);
        } else {
          const tenantId = this.form.get('tenantId')?.value;
          this.loadRolesForContext({ tenant: tenantId || undefined, type: tenantId ? undefined : 'tenant' });
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
      email: string;
      password: string;
      role: string;
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
      email: value.email,
      password: value.password,
      role: value.role,
      tenantId: value.isGlobalAdmin ? null : value.tenantId,
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
    } else {
      tenantControl?.enable();
    }
    this.form.updateValueAndValidity();
  }

  private loadGlobalRoles(): void {
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
        },
        error: (error) => {
          console.error('[AdminCreateUserDialog] Failed to load global roles', error);
          this.notifications.error('Greška pri učitavanju globalnih rola.');
          this.loadingRoles = false;
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
          console.error('[AdminCreateUserDialog] Failed to load tenant roles', error);
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
          console.error('[AdminCreateUserDialog] Failed to load tenants', error);
          this.notifications.error('Greška pri učitavanju tenanata.');
        },
      });
  }

  private validateTenantRequirement(control: AbstractControl) {
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


