import { Routes } from '@angular/router';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './modules/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { AppointmentsComponent } from './modules/appointments/appointments.component';
import { ClientsComponent } from './modules/clients/clients.component';
import { EmployeesComponent } from './modules/employees/employees.component';
import { ScopeGuard } from './core/guards/scope.guard';
import { GlobalAdminGuard } from './core/guards/global-admin.guard';
import { UnauthorizedComponent } from './modules/unauthorized/unauthorized.component';
import { UserAdministrationComponent } from './modules/user-administration/user-administration.component';
import { ServicesComponent } from './modules/services/services.component';
import { ClientDetailViewComponent } from './modules/clients/client-detail-view/client-detail-view.component';
import { SettingsComponent } from './modules/settings/settings.component';
import { WorkingShiftsComponent } from './modules/working-shifts/working-shifts.component';
import { Suppliers } from './modules/suppliers/suppliers';
import { Articles } from './modules/articles/articles';
import { PosSalesComponent } from './modules/pos/components/sales/pos-sales/pos-sales.component';
import { PosReportsComponent } from './modules/pos/components/reports/pos-reports/pos-reports.component';
import { PosSettingsComponent } from './modules/pos/components/settings/pos-settings/pos-settings.component';
import { CashSessionDashboardComponent } from './modules/pos/components/cash-management/cash-session-dashboard/cash-session-dashboard.component';
import { CashReportsComponent } from './modules/pos/components/reports/cash-reports/cash-reports.component';
import { CashAnalyticsComponent } from './modules/pos/components/cash-management/cash-analytics/cash-analytics.component';
import { ClientLoginComponent } from './modules/client-login/client-login.component';
import { ClientDashboardComponent } from './modules/client-dashboard/client-dashboard.component';
import { ClaimAppointmentComponent } from './modules/appointments/claim-appointment/claim-appointment.component';
import { TenantAccessGuard } from './core/guards/tenant-access.guard';
import { GlobalScopeGuard } from './core/guards/global-scope.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent, // Parent route with the layout
    canActivate: [AuthGuard, TenantAccessGuard],   // Ensure user is logged in and tenant allowed
    children: [
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_home:access',
          title: 'Home',
          icon: 'home'
        }
      },
      {
        path: 'client-dashboard',
        component: ClientDashboardComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_client_dashboard:access',
          title: 'Client Dashboard',
          icon: 'dashboard'
        }
      },
      {
        path: 'appointments',
        component: AppointmentsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_appointments:access',
          title: 'Appointments',
          icon: 'event'
        }
      },
      {
        path: 'working-shifts',
        component: WorkingShiftsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_working_shifts:access',
          title: 'Working Shifts',
          icon: 'calendar_month'
        }
      },
      {
        path: 'clients',
        component: ClientsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_clients:access',
          title: 'Clients',
          icon: 'people'
        }
      },{
        path: 'clients/:id',
        component: ClientDetailViewComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_clients:access',
          title: 'Clients',
          icon: 'people'
        }
      },
      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_employees:access',
          title: 'Employees',
          icon: 'supervisor_account'
        }
      },
      {
        path: 'user-administration',
        component: UserAdministrationComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_user_administration:access',
          title: 'User Administration',
          icon: 'admin_panel_settings'
        }
      },
      {
        path: 'services',
        component: ServicesComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_services:access',
          title: 'Services',
          icon: 'content_cut'
        }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_settings:access',
          title: 'Settings',
          icon: 'settings'
        }
      },
      {
        path: 'admin',
        canActivate: [GlobalAdminGuard],
        loadChildren: () =>
          import('./modules/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
        data: {
          title: 'Global Admin',
          icon: 'public',
        },
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'suppliers',
        component: Suppliers,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_suppliers:access',
          title: 'Suppliers',
          icon: 'suppliers'
        }
      },
      {
        path: 'articles',
        component: Articles,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_articles:access',
          title: 'Articles',
          icon: 'articles'
        }
      },
      {
        path: 'pos',
        children: [
          {
            path: 'sales',
            component: PosSalesComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:sale',
              title: 'POS Sales',
              icon: 'point_of_sale'
            }
          },
          {
            path: 'cash-management',
            component: CashSessionDashboardComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:cash_management',
              title: 'Cash Management',
              icon: 'account_balance'
            }
          },
          {
            path: 'reports',
            component: PosReportsComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:report',
              title: 'POS Reports',
              icon: 'assessment'
            }
          },
          {
            path: 'cash-reports',
            component: CashReportsComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:cash_reports',
              title: 'Cash Reports',
              icon: 'assessment'
            }
          },
          {
            path: 'cash-analytics',
            component: CashAnalyticsComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:cash_analytics',
              title: 'Cash Analytics',
              icon: 'analytics'
            }
          },
          {
            path: 'settings',
            component: PosSettingsComponent,
            canActivate: [ScopeGuard],
            data: {
              scope: 'scope_pos:settings',
              title: 'POS Settings',
              icon: 'settings'
            }
          },
          {
            path: '',
            redirectTo: 'sales',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent,
        data: {
          title: 'Unauthorized',
          icon: 'lock'
        }
      },
      {
        path: 'flowzen-ai',
        loadComponent: () =>
          import('./modules/flowzen-ai/components/flowzen-ai-dashboard/flowzen-ai-dashboard.component').then(
            (m) => m.FlowzenAiDashboardComponent,
          ),
        data: {
          title: 'Flowzen AI',
          scope: 'global.beta:*',
          description: 'Upravljanje AI agentima i minionima.',
          icon: 'smart_toy'
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'flowzen-ai/:id',
        loadComponent: () =>
          import('./modules/flowzen-ai/components/agent-detail/agent-detail.component').then(
            (m) => m.AgentDetailComponent,
          ),
        data: {
          title: 'Agent Details',
          scope: 'global.beta:*',
          description: 'Detalji AI agenta.',
          icon: 'smart_toy'
        },
        canActivate: [GlobalScopeGuard],
      },
      {
        path: 'demo-chile',
        loadComponent: () =>
          import('./modules/demo-chile/demo-chile.component').then(
            (m) => m.DemoChileComponent,
          ),
        data: {
          title: 'Demo Chile',
          scope: 'global.beta:*',
          description: 'Demo komponenta za Chile.',
          icon: 'public'
        },
        canActivate: [GlobalScopeGuard],
      }
    ],
  },
  { path: 'login', component: LoginComponent },
  { path: 'client-login', component: ClientLoginComponent },
  { path: 'appointments/claim/:token', component: ClaimAppointmentComponent },
  {
    path: 'access-restriction',
    loadComponent: () =>
      import('./modules/access-restriction/access-restriction.component').then(
        (m) => m.AccessRestrictionComponent,
      ),
  },
  { path: '**', redirectTo: 'login' }
];
