import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../core/services/auth.service';


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterModule, 
    MatSidenavModule, 
    MatListModule, 
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    FlexLayoutModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit{
  opened = true;
  user: any; 

  constructor(private authService: AuthService) {}

  ngOnInit() {
    if(this.authService.isLoggedIn()) {
      this.user = this.authService.getUserInfo();
      console.log(this.user)
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleMenu() {
    this.opened = !this.opened;
  }

  
}
