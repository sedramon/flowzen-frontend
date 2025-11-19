import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../core/services/auth.service';
import { AuthenticatedUser } from '../models/AuthenticatedUser';
import { filter, map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, 
    MatIconModule,
    FlexLayoutModule,
    ButtonModule,
    MenuModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  currentUser: AuthenticatedUser | null = null;
  currentTitle = 'Flowzen';
  currentIcon = '';
  posMenuItems: MenuItem[] = [];
  showPosMenu = false;

  constructor(public authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      this.updatePosMenu();
    });
    
    // Listen for navigation changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data;
        })
      )
      .subscribe((data) => {
        this.currentTitle = data?.['title'] || 'Flowzen';
        this.currentIcon = data?.['icon'] || 'home';
      });
  }

  updatePosMenu() {
    this.posMenuItems = [];
    
    if (this.authService.isModuleEnabled('scope_pos:sale')) {
      this.showPosMenu = true;
      this.posMenuItems.push({
        label: 'Prodaja',
        icon: 'pi pi-shopping-cart',
        command: () => this.router.navigate(['/pos/sales'])
      });
    }
    
    if (this.authService.isModuleEnabled('scope_pos:cash_management')) {
      this.posMenuItems.push({
        label: 'Cash Management',
        icon: 'pi pi-wallet',
        command: () => this.router.navigate(['/pos/cash-management'])
      });
    }
    
    if (this.authService.isModuleEnabled('scope_pos:report')) {
      this.posMenuItems.push({
        label: 'Izveštaji',
        icon: 'pi pi-chart-bar',
        command: () => this.router.navigate(['/pos/reports'])
      });
    }
    
    if (this.authService.isModuleEnabled('scope_pos:cash_reports')) {
      this.posMenuItems.push({
        label: 'Cash Izveštaji',
        icon: 'pi pi-chart-line',
        command: () => this.router.navigate(['/pos/cash-reports'])
      });
    }
    
    if (this.authService.isModuleEnabled('scope_pos:cash_analytics')) {
      this.posMenuItems.push({
        label: 'Cash Analitika',
        icon: 'pi pi-chart-pie',
        command: () => this.router.navigate(['/pos/cash-analytics'])
      });
    }
    
    if (this.authService.isModuleEnabled('scope_pos:settings')) {
      this.posMenuItems.push({
        label: 'POS Podešavanja',
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/pos/settings'])
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  togglePosMenu(menu: any, event: Event) {
    menu.toggle(event);
  }
}
