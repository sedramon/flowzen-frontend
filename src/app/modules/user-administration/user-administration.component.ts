import {
  AfterViewInit,
  Component,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UserAdministrationService } from './services/user-administration.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { Role } from '../../models/Role';
import { MatDialog } from '@angular/material/dialog';
import { EditRoleDialogComponent } from './dialogs/edit-role-dialog/edit-role-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { AddRoleDialogComponent } from './dialogs/add-role-dialog/add-role-dialog.component';
import { AddUserDialogComponent } from './dialogs/add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from './dialogs/edit-user-dialog/edit-user-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-user-administration',
  standalone: true,
  imports: [
    FlexLayoutModule,
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatIconButton,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
  ],
  templateUrl: './user-administration.component.html',
  styleUrl: './user-administration.component.scss',
})
export class UserAdministrationComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  roles: Role[] = [];

  displayedColumnsUsers: string[] = ['name', 'email', 'role', 'actions'];
  dataSourceUsers = new MatTableDataSource<User>(this.users);

  displayedColumnsRoles: string[] = ['name', 'actions'];
  dataSourceRoles = new MatTableDataSource<Role>(this.roles);

  // Use @ViewChildren instead of @ViewChild to get multiple paginators
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  // Use @ViewChild for each table's sort
  @ViewChild('userSort', { static: false })
  set userSort(ms: MatSort) {
    if (ms) {
      this.dataSourceUsers.sort = ms;
    }
  }
  @ViewChild('roleSort')
  set roleSort(ms: MatSort) {
    if (ms) {
      this.dataSourceRoles.sort = ms;
    }
  }

  constructor(
    private userAdministrationService: UserAdministrationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private userAdminService: UserAdministrationService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    // Učitavanje podataka sa API-ja
    this.userAdministrationService.fetchUsers(currentUser.tenant!).subscribe({
      next: (data) => {
        console.log('Users fetched:', data);
        this.dataSourceUsers.data = data;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      },
    });

    this.userAdministrationService.fetchRoles(this.authService.getCurrentUser()!.tenant!).subscribe({
      next: (data) => {
        console.log('Roles fetched:', data);
        this.dataSourceRoles.data = data;
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
      },
    });

    // Pretplata na BehaviorSubject za reaktivno ažuriranje
    this.userAdministrationService.users$.subscribe((data) => {
      this.users = data;
    });

    this.userAdministrationService.roles$.subscribe((data) => {
      this.roles = data;
    });
  }

  ngAfterViewInit(): void {
    // Assign paginators and sorts correctly
    if (this.paginators.length > 1) {
      this.dataSourceUsers.paginator = this.paginators.toArray()[0];
      this.dataSourceRoles.paginator = this.paginators.toArray()[1];
    }
  }

  openEditRoleDialog(role: Role) {
    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      width: '1000px',
      height: '600px',
      data: { role },
    });

    

    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        console.log('Role to edit:', updatedData);
        this.userAdminService.updateRole(role._id!, updatedData).subscribe(
          (updatedRole) => {
            this.showSnackbar(`Role "${role.name}" updated successfully`);
            this.dataSourceRoles.data = this.dataSourceRoles.data.map((r) =>
              r._id === updatedRole._id ? updatedRole : r
            );
          },
          (error) => {
            console.error('Error updating role:', error);
            this.showSnackbar('Failed to update role', true);
          }
        );
      }
    });
  }

  openEditUserDialog(user: User) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      height: '500px',
      data: { user },
    });

    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        this.userAdminService.updateUser(user._id!, updatedData).subscribe(
          (updatedUser) => {
            this.showSnackbar(`User "${user.name}" updated successfully`);
            this.dataSourceUsers.data = this.dataSourceUsers.data.map((u) =>
              u._id === updatedUser._id ? updatedUser : u
            );
          },
          (error) => {
            console.error('Error updating user:', error);
            this.showSnackbar('Failed to update user', true);
          }
        );
      }
    });
  }

  openAddRoleDialog() {
    const dialogRef = this.dialog.open(AddRoleDialogComponent, {
      width: '600px',
      height: '500px',
    });

    dialogRef.afterClosed().subscribe((role: Role | undefined) => {
      if (role) {
        this.userAdministrationService.createRole(role).subscribe(
          (createdRole) => {
            const updatedData = [...this.dataSourceRoles.data, createdRole];
            this.dataSourceRoles.data = updatedData;
            this.showSnackbar(`Role "${role.name}" created successfully`);
          },
          (error) => {
            console.error('Error creating role:', error);
            this.showSnackbar('Failed to create role', true);
          }
        );
      }
    });
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '600px',
      height: '600px',
    });

    dialogRef.afterClosed().subscribe((user: User | undefined) => {
      if (user) {
        this.userAdministrationService.createUser(user).subscribe(
          (createdUser) => {
            const updatedData = [...this.dataSourceUsers.data, createdUser];
            this.dataSourceUsers.data = updatedData;
            this.showSnackbar(`User "${user.name}" created successfully`);
          },
          (error) => {
            console.error('Error creating user:', error);
            this.showSnackbar('Failed to create user', true);
          }
        );
      }
    });
  }

  deleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete ${user.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userAdministrationService.deleteUser(user._id!).subscribe({
          next: () => {
            this.dataSourceUsers.data = this.dataSourceUsers.data.filter(
              (u) => u._id !== user._id
            );
            this.showSnackbar(`User "${user.name}" deleted successfully`);
          },
          error: (err) => {
            this.showSnackbar('Failed to delete user', true);
          },
        });
      }
    });
  }

  deleteRole(selectedRole: Role) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '250px',
      data: {
        title: 'Delete Facility',
        message: `Are you sure you want to delete ${selectedRole.name}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userAdministrationService
          .deleteRole(selectedRole!._id!)
          .subscribe({
            next: () => {
              this.dataSourceRoles.data = this.dataSourceRoles.data.filter(
                (r) => r._id !== selectedRole!._id
              );
              this.showSnackbar(
                `Role "${selectedRole!.name}" deleted successfully`
              );
            },
            error: (err) => {
              this.showSnackbar('Failed to delete role', true);
            },
          });
      }
    });
  }

  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // 3 seconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'], // Ensure it's an array
    });
  }
}
