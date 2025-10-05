import { Routes } from '@angular/router';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './modules/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { AppoitmentsComponent } from './modules/appoitments/appoitments.component';
import { ClientsComponent } from './modules/clients/clients.component';
import { EmployeesComponent } from './modules/employees/employees.component';
import { ScopeGuard } from './core/guards/scope.guard';
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

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent, // Parent route with the layout
    canActivate: [AuthGuard],   // Ensure user is logged in
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
        path: 'appoitments',
        component: AppoitmentsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_appoitments:access',
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
      }
    ],
  },
  { path: 'login', component: LoginComponent }, // Login route without the layout
  { path: '**', redirectTo: 'login' }           // Redirect unknown routes to login
];
