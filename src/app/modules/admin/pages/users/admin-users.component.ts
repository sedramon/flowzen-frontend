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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminUser, AdminUserGroup } from '../../models/admin-user.model';
import { AdminNotificationsService } from '../../shared/services/admin-notifications.service';
import {
  AdminCreateUserDialogComponent,
  AdminCreateUserDialogResult,
} from './dialogs/admin-create-user-dialog.component';
import {
  AdminEditUserDialogComponent,
  AdminEditUserDialogData,
  AdminEditUserDialogResult,
} from './dialogs/admin-edit-user-dialog.component';
import {
  AdminResetPasswordDialogComponent,
  AdminResetPasswordDialogResult,
} from './dialogs/admin-reset-password-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/dialogs/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
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
    MatSlideToggleModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  loading = false;
  globalUsers: AdminUser[] = [];
  tenantGroups: AdminUserGroup[] = [];
  filteredGlobalUsers: AdminUser[] = [];
  filteredTenantGroups: AdminUserGroup[] = [];
  private readonly processingUsers = new Set<string>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly usersService: AdminUsersService,
    private readonly notifications: AdminNotificationsService,
    private readonly dialog: MatDialog,
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      view: ['all'],
    });
  }

  ngOnInit(): void {
    this.loadUserGroups();

    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
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
    this.loadUserGroups();
  }

  trackByUserId(_index: number, user: AdminUser): string {
    return user._id;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<AdminCreateUserDialogComponent, undefined, AdminCreateUserDialogResult>(
      AdminCreateUserDialogComponent,
      {
        width: '800px',
        maxWidth: '99vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  openEditDialog(user: AdminUser): void {
    const dialogRef = this.dialog.open<
      AdminEditUserDialogComponent,
      AdminEditUserDialogData,
      AdminEditUserDialogResult
    >(AdminEditUserDialogComponent, {
      width: '900px',
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'admin-dialog-panel',
      data: {
        user,
      },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.updateUser(user._id, result);
      }
    });
  }

  openResetPasswordDialog(user: AdminUser): void {
    const dialogRef = this.dialog.open<
      AdminResetPasswordDialogComponent,
      { user: AdminUser },
      AdminResetPasswordDialogResult
    >(AdminResetPasswordDialogComponent, {
      width: '900px',
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'admin-dialog-panel',
      data: { user },
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.resetPassword(user._id, result.password);
      }
    });
  }

  confirmDelete(user: AdminUser): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '900px',
        maxWidth: '92vw',
        disableClose: true,
        panelClass: 'admin-dialog-panel',
        data: {
          title: 'Obriši korisnika',
          description: `Potvrdi brisanje korisnika <strong>${user.email}</strong>. Ova akcija je nepovratna.`,
          confirmLabel: 'Obriši',
          confirmColor: 'warn',
        },
      },
    );

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteUser(user._id);
      }
    });
  }

  isProcessing(userId: string): boolean {
    return this.processingUsers.has(userId);
  }

  private loadUserGroups(): void {
    this.loading = true;

    this.usersService
      .listUserGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          const globalGroup = groups.find((group) => group.tenant.isGlobal);
          this.globalUsers = globalGroup ? [...globalGroup.users] : [];
          this.tenantGroups = groups.filter((group) => !group.tenant.isGlobal);
          this.processingUsers.clear();
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('[AdminUsersComponent] Failed to load users', error);
          this.notifications.error('Greška pri učitavanju korisnika.');
          this.processingUsers.clear();
          this.loading = false;
        },
      });
  }

  private applyFilters(): void {
    const { search, view } = this.filterForm.value;
    const normalizedSearch = (search as string)?.trim().toLowerCase() ?? '';

    const matchesSearch = (user: AdminUser): boolean => {
      if (!normalizedSearch) return true;
      const tokens = [
        user.name,
        user.email,
        typeof user.role === 'string'
          ? user.role
          : user.role?.name,
        user.tenant?.name ?? '',
      ];
      return tokens.some((token) => token?.toLowerCase().includes(normalizedSearch));
    };

    this.filteredGlobalUsers =
      view === 'tenant'
        ? []
        : this.globalUsers.filter(matchesSearch);

    const tenantGroups =
      view === 'global'
        ? []
        : this.tenantGroups
            .map((group) => ({
              tenant: group.tenant,
              users: group.users.filter(matchesSearch),
            }))
            .filter((group) => group.users.length > 0);

    this.filteredTenantGroups = tenantGroups;
  }

  getRoleLabel(user: AdminUser): string {
    if (user.isGlobalAdmin) {
      return 'Superadmin';
    }
    return this.getRoleName(user);
  }

  getRoleName(user: AdminUser): string {
    if (typeof user.role === 'string') {
      return user.role || '—';
    }
    if (user.role && 'name' in user.role) {
      return user.role.name;
    }
    return '—';
  }

  private createUser(payload: AdminCreateUserDialogResult): void {
    this.loading = true;
    this.usersService
      .createUser(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Korisnik je kreiran.');
          this.refresh();
        },
        error: (error) => {
          console.error('[AdminUsersComponent] Failed to create user', error);
          this.notifications.error('Kreiranje korisnika nije uspelo.');
          this.loading = false;
        },
      });
  }

  private updateUser(userId: string, payload: AdminEditUserDialogResult): void {
    this.processingUsers.add(userId);
    this.usersService
      .updateUser(userId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          this.notifications.success('Korisnik je ažuriran.');
          this.processingUsers.delete(userId);
          this.upsertUser(updatedUser);
        },
        error: (error) => {
          console.error('[AdminUsersComponent] Failed to update user', error);
          this.notifications.error('Ažuriranje korisnika nije uspelo.');
          this.processingUsers.delete(userId);
        },
      });
  }

  private resetPassword(userId: string, password: string): void {
    this.processingUsers.add(userId);
    this.usersService
      .resetPassword(userId, { password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.info('Lozinka je resetovana.');
          this.processingUsers.delete(userId);
        },
        error: (error) => {
          console.error('[AdminUsersComponent] Failed to reset password', error);
          this.notifications.error('Reset lozinke nije uspeo.');
          this.processingUsers.delete(userId);
        },
      });
  }

  private deleteUser(userId: string): void {
    this.processingUsers.add(userId);
    this.usersService
      .deleteUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.success('Korisnik je obrisan.');
          this.refresh();
        },
        error: (error) => {
          console.error('[AdminUsersComponent] Failed to delete user', error);
          this.notifications.error('Brisanje korisnika nije uspelo.');
          this.processingUsers.delete(userId);
        },
      });
  }

  private upsertUser(updatedUser: AdminUser): void {
    const isGlobal = updatedUser.isGlobalAdmin || !updatedUser.tenant;

    this.globalUsers = this.globalUsers.filter((user) => user._id !== updatedUser._id);
    this.tenantGroups = this.tenantGroups
      .map((group) => ({
        tenant: group.tenant,
        users: group.users.filter((user) => user._id !== updatedUser._id),
      }))
      .filter((group) => group.users.length > 0);

    if (isGlobal) {
      this.globalUsers = [...this.globalUsers, updatedUser];
    } else if (updatedUser.tenant?._id) {
      const existingGroup = this.tenantGroups.find((group) => group.tenant._id === updatedUser.tenant?._id);
      if (existingGroup) {
        existingGroup.users = [...existingGroup.users, updatedUser];
      } else {
        this.tenantGroups = [
          ...this.tenantGroups,
          {
            tenant: updatedUser.tenant,
            users: [updatedUser],
          },
        ];
      }
    }

    this.applyFilters();
  }

}

