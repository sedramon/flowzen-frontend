import { Component, OnInit } from '@angular/core';
import { UserAdministrationService } from './services/user-administration.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../models/Role';
import { MatDialog } from '@angular/material/dialog';
import { EditRoleDialogComponent } from './dialogs/edit-role-dialog/edit-role-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { AddRoleDialogComponent } from './dialogs/add-role-dialog/add-role-dialog.component';
import { AddUserDialogComponent } from './dialogs/add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from './dialogs/edit-user-dialog/edit-user-dialog.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-user-administration',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    AvatarModule,
    DividerModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './user-administration.component.html',
  styleUrl: './user-administration.component.scss',
})
export class UserAdministrationComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [];

  constructor(
    private userAdministrationService: UserAdministrationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private userAdminService: UserAdministrationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // Fetch users and roles
    this.userAdministrationService.fetchUsers(this.authService.requireCurrentTenantId()).subscribe({
      next: (data) => {
        console.log('Users fetched:', data);
        this.users = data;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });

    this.userAdministrationService.fetchRoles(this.authService.requireCurrentTenantId()).subscribe({
      next: (data) => {
        console.log('Roles fetched:', data);
        this.roles = data;
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
      },
    });

    // Subscribe to reactive updates
    this.userAdministrationService.users$.subscribe((data) => {
      this.users = data;
    });

    this.userAdministrationService.roles$.subscribe((data) => {
      this.roles = data;
    });
  }

  openEditRoleDialog(role: Role) {
    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      disableClose: false,
      autoFocus: true,
      data: { role },
    });

    

    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        console.log('Role to edit:', updatedData);
        this.userAdminService.updateRole(role._id!, updatedData).subscribe(
          (updatedRole) => {
            this.showToast(`Uloga "${role.name}" uspešno ažurirana`);
            this.roles = this.roles.map((r) =>
              r._id === updatedRole._id ? updatedRole : r
            );
          },
          (error) => {
            console.error('Error updating role:', error);
            this.showToast('Neuspešno ažuriranje uloge', true);
          }
        );
      }
    });
  }

  openEditUserDialog(user: User) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        this.userAdminService.updateUser(user._id!, updatedData).subscribe(
          (updatedUser) => {
            this.showToast(`Korisnik "${user.name}" uspešno ažuriran`);
            this.users = this.users.map((u) =>
              u._id === updatedUser._id ? updatedUser : u
            );
          },
          (error) => {
            console.error('Error updating user:', error);
            this.showToast('Neuspešno ažuriranje korisnika', true);
          }
        );
      }
    });
  }

  openAddRoleDialog() {
    const dialogRef = this.dialog.open(AddRoleDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      disableClose: false,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((role: Role | undefined) => {
      if (role) {
        this.userAdministrationService.createRole(role).subscribe(
          (createdRole) => {
            this.roles = [...this.roles, createdRole];
            this.showToast(`Uloga "${role.name}" uspešno kreirana`);
          },
          (error) => {
            console.error('Error creating role:', error);
            this.showToast('Neuspešno kreiranje uloge', true);
          }
        );
      }
    });
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((user: User | undefined) => {
      if (user) {
        this.userAdministrationService.createUser(user).subscribe(
          (createdUser) => {
            this.users = [...this.users, createdUser];
            this.showToast(`Korisnik "${user.name}" uspešno kreiran`);
          },
          (error) => {
            console.error('Error creating user:', error);
            this.showToast('Neuspešno kreiranje korisnika', true);
          }
        );
      }
    });
  }

  deleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje korisnika',
        message: `Da li ste sigurni da želite da obrišete ${user.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userAdministrationService.deleteUser(user._id!).subscribe({
          next: () => {
            this.users = this.users.filter((u) => u._id !== user._id);
            this.showToast(`Korisnik "${user.name}" uspešno obrisan`);
          },
          error: (err) => {
            this.showToast('Neuspešno brisanje korisnika', true);
          },
        });
      }
    });
  }

  deleteRole(selectedRole: Role) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: {
        title: 'Brisanje uloge',
        message: `Da li ste sigurni da želite da obrišete ${selectedRole.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userAdministrationService
          .deleteRole(selectedRole!._id!)
          .subscribe({
            next: () => {
              this.roles = this.roles.filter((r) => r._id !== selectedRole!._id);
              this.showToast(`Uloga "${selectedRole!.name}" uspešno obrisana`);
            },
            error: (err) => {
              this.showToast('Neuspešno brisanje uloge', true);
            },
          });
      }
    });
  }

  showToast(message: string, isError: boolean = false) {
    this.messageService.add({
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Greška' : 'Uspešno',
      detail: message,
      life: 3000
    });
  }
}
