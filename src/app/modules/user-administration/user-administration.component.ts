import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { UserAdministrationService } from './services/user-administration.service';
import { User } from '../../models/User';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-administration',
  standalone: true,
  imports: [FlexLayoutModule, CommonModule],
  templateUrl: './user-administration.component.html',
  styleUrl: './user-administration.component.scss'
})
export class UserAdministrationComponent implements OnInit {
  users: User[] = [];

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

}
