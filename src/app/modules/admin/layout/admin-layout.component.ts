import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
  scope?: string;
  description?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly navItems: AdminNavItem[] = [
    {
      label: 'Pregled',
      icon: 'analytics',
      route: 'overview',
      scope: 'global.tenants:read',
      description: 'Centralizovani uvid u tenante i aktivnosti.',
    },
    {
      label: 'Tenanti',
      icon: 'domain',
      route: 'tenants',
      scope: 'global.tenants:read',
      description: 'Upravljanje životnim ciklusom, licencama i suspenzijama.',
    },
    {
      label: 'Korisnici',
      icon: 'groups',
      route: 'users',
      scope: 'global.users:read',
      description: 'Pregled i održavanje korisnika na svim tenantima.',
    },
    {
      label: 'Uloge',
      icon: 'workspace_premium',
      route: 'roles',
      scope: 'global.users:read',
      description: 'Dizajniranje setova dozvola za timove.',
    },
    {
      label: 'Scope-ovi',
      icon: 'tune',
      route: 'scopes',
      scope: 'global.scopes:*',
      description: 'Upravljanje RBAC scope-ovima za globalnu administraciju.',
    },
    {
      label: 'Audit Log',
      icon: 'history',
      route: 'audit',
      scope: 'global.audit:*',
      description: 'Pregled izmena visokih privilegija i aktivnosti.',
    },
  ];

  visibleNavItems: AdminNavItem[] = [];
  pageTitle = 'Pregled';
  pageDescription = 'Centralizovani uvid u tenante i aktivnosti.';
  activeRoute = 'overview';
  sidenavOpened = true;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.filterNavItems();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.updateRouteState());

    this.updateRouteState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  isActive(item: AdminNavItem): boolean {
    return this.activeRoute === item.route;
  }

  private filterNavItems(): void {
    this.visibleNavItems = this.navItems.filter((item) => {
      if (!item.scope) {
        return true;
      }
      return this.authService.hasGlobalScope(item.scope);
    });
  }

  private updateRouteState(): void {
    this.filterNavItems();

    const deepest = this.getDeepestChild(this.route);
    const data = deepest?.snapshot.data ?? {};
    const routePath = deepest?.routeConfig?.path;

    const matchingNav = this.navItems.find((item) => item.route === routePath);

    if (matchingNav) {
      this.activeRoute = matchingNav.route;
      this.pageTitle = data['title'] ?? matchingNav.label;
      this.pageDescription = data['description'] ?? matchingNav.description ?? '';
    } else {
      this.activeRoute = routePath ?? 'overview';
      this.pageTitle = data['title'] ?? 'Global Admin';
      this.pageDescription = data['description'] ?? '';
    }
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute | null {
    let child = route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    return child ?? route;
  }
}

