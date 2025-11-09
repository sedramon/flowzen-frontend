import { Routes } from '@angular/router';
import { GlobalScopeGuard } from '../../core/guards/global-scope.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/overview/admin-overview.component').then(
            (m) => m.AdminOverviewComponent,
          ),
        data: {
          title: 'Overview',
          scope: 'global.tenants:read',
          description: 'Centralized insight across tenants, users and recent actions.',
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./pages/tenants/admin-tenants.component').then(
            (m) => m.AdminTenantsComponent,
          ),
        data: {
          title: 'Tenants',
          scope: 'global.tenants:read',
          description: 'Audit tenant health, licensing and lifecycle events.',
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
        data: {
          title: 'Users',
          scope: 'global.users:read',
          description: 'Review and manage users across all tenants.',
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/admin-roles.component').then(
            (m) => m.AdminRolesComponent,
          ),
        data: {
          title: 'Roles',
          scope: 'global.users:read',
          description: 'Design and assign role templates for global and tenant teams.',
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'scopes',
        loadComponent: () =>
          import('./pages/scopes/admin-scopes.component').then(
            (m) => m.AdminScopesComponent,
          ),
        data: {
          title: 'Scopes',
          scope: 'global.scopes:*',
          description: 'Maintain global scope catalogue and access policies.',
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./pages/audit/admin-audit.component').then(
            (m) => m.AdminAuditComponent,
          ),
        data: {
          title: 'Audit Log',
          scope: 'global.audit:*',
          description: 'Trace privileged changes and sensitive operations.',
        },
        canActivate: [GlobalScopeGuard],
      },
    ],
  },
];

