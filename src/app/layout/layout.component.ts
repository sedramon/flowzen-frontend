import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../core/services/auth.service';
import { AuthenticatedUser } from '../models/AuthenticatedUser';
import { filter, map } from 'rxjs';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf } from '@angular/common';



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
    FlexLayoutModule,
    MatTooltip,
    MatMenuModule,
    NgIf
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit{
  currentUser: AuthenticatedUser | null = null;
  opened = true;
  currentTitle = 'Flowzen';
  currentIcon = '';

  constructor(public authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
    });
    // Listen for navigation changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          // Find the deepest activated route
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data;
        })
      )
      .subscribe((data) => {
        // If data is defined, use it to set the title and icon
        this.currentTitle = data?.['title'] || 'Flowzen';
        this.currentIcon = data?.['icon'] || 'home';
      });
  }

  logout() {
    this.authService.logout();
  }

  toggleMenu() {
    this.opened = !this.opened;
  }

  
}
