import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UserAdministrationService } from './services/user-administration.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';


@Component({
  selector: 'app-user-administration',
  standalone: true,
  imports: [FlexLayoutModule, CommonModule, MatPaginatorModule, MatTableModule, MatSortModule, MatIconModule, MatIconButton],
  templateUrl: './user-administration.component.html',
  styleUrl: './user-administration.component.scss'
})
export class UserAdministrationComponent implements OnInit, AfterViewInit {
  users: User[] = [];

  displayedColumnsUsers: string[] = ['name', 'email', 'role', 'tenant', 'actions'];
  dataSourceUsers = new MatTableDataSource<User>(this.users);

  @ViewChild(MatPaginator) paginatorUsers!: MatPaginator;
  @ViewChild(MatSort) sortUsers!: MatSort;

  constructor(private userAdministrationService: UserAdministrationService, private authService: AuthService) { }

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

    // Pretplata na BehaviorSubject za reaktivno ažuriranje
    this.userAdministrationService.users$.subscribe((data) => {
      this.users = data;
    });
  }

  ngAfterViewInit(): void {
      this.dataSourceUsers.paginator = this.paginatorUsers;
      this.dataSourceUsers.sort = this.sortUsers;
  }

  deleteUser(user: User) {
    console.log('Deleting user : ' + user.name);
  }

}
