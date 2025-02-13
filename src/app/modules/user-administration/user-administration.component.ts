import { AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UserAdministrationService } from './services/user-administration.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Role } from '../../models/Role';
import { MatDialog } from '@angular/material/dialog';
import { EditRoleDialogComponent } from './dialogs/edit-role-dialog/edit-role-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { AddRoleDialogComponent } from './dialogs/add-role-dialog/add-role-dialog.component';
import { AddUserDialogComponent } from './dialogs/add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from './dialogs/edit-user-dialog/edit-user-dialog.component';


@Component({
  selector: 'app-user-administration',
  standalone: true,
  imports: [FlexLayoutModule, CommonModule, MatPaginatorModule, MatTableModule, MatSortModule, MatIconModule, MatIconButton, MatDividerModule],
  templateUrl: './user-administration.component.html',
  styleUrl: './user-administration.component.scss'
})
export class UserAdministrationComponent implements OnInit, AfterViewInit {
  users: User[] = [];
  roles: Role[] = [];

  displayedColumnsUsers: string[] = ['name', 'email', 'role','actions'];
  dataSourceUsers = new MatTableDataSource<User>(this.users);

  displayedColumnsRoles: string[] = [
    'name',
    'actions'
  ];
  dataSourceRoles = new MatTableDataSource<Role>(this.roles);

  // Use @ViewChildren instead of @ViewChild to get multiple paginators
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;


  constructor(private userAdministrationService: UserAdministrationService, private authService: AuthService, private dialog: MatDialog, private userAdminService: UserAdministrationService) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }
    // Učitavanje podataka sa API-ja
    this.userAdministrationService.fetchUsers(currentUser.tenant).subscribe({
      next: (data) => {
        console.log("Users fetched:", data);
        this.dataSourceUsers.data = data;
      },
      error: (err) => {
        console.error("Error fetching users:", err);
      },
    });

    this.userAdministrationService.fetchRoles().subscribe({
      next: (data) => {
        console.log("Roles fetched:", data);
        this.dataSourceRoles.data = data;
      },
      error: (err) => {
        console.error("Error fetching roles:", err);
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

    if (this.sorts.length > 1) {
      this.dataSourceUsers.sort = this.sorts.toArray()[0];
      this.dataSourceRoles.sort = this.sorts.toArray()[1];
    }
  }

  openEditRoleDialog(role: Role) {
    const dialogRef = this.dialog.open(EditRoleDialogComponent, {
      width: '500px',
      height: '500px',
      data: { role } // Pass the selected role to the dialog
    });
  
    // Handle dialog close event
    dialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        console.log('Updated role data:', updatedData);
  
        // Send API request to update the role
        this.userAdminService.updateRole(role._id, updatedData).subscribe(
          (updatedRole) => {
            console.log('Role successfully updated:', updatedRole);
  
            // Refresh roles list to reflect the changes
            this.userAdminService.fetchRoles().subscribe();
          },
          (error) => {
            console.error('Error updating role:', error);
          }
        );
      }
    });
  }
  

  openEditUserDialog(user: User) {
    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '500px',
      height: '500px',
    })
  }

  openAddRoleDialog() {
    const dialogRef = this.dialog.open(AddRoleDialogComponent, {
      width: '500px',
      height: '500px',
    })
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '500px',
      height: '500px',
    })
  }

  deleteUser(){
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '500px',
    })
  }

  deleteRole() {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '500px',
      height: '500px',
    })
  }


}
