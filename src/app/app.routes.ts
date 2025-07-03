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
          scope: 'scope_home',
          title: 'Home',
          icon: 'home'
        }
      },
      {
        path: 'appoitments',
        component: AppoitmentsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_appoitments',
          title: 'Appointments',
          icon: 'event'
        }
      },
      {
        path: 'working-shifts',
        component: WorkingShiftsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_working_shifts',
          title: 'Working Shifts',
          icon: 'calendar_month'
        }
      },
      {
        path: 'clients',
        component: ClientsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_clients',
          title: 'Clients',
          icon: 'people'
        }
      },{
        path: 'clients/:id',
        component: ClientDetailViewComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_clients',
          title: 'Clients',
          icon: 'people'
        }
      },
      {
        path: 'employees',
        component: EmployeesComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_employees',
          title: 'Employees',
          icon: 'supervisor_account'
        }
      },
      {
        path: 'user-administration',
        component: UserAdministrationComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_user_administration',
          title: 'User Administration',
          icon: 'admin_panel_settings'
        }
      },
      {
        path: 'services',
        component: ServicesComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_services',
          title: 'Services',
          icon: 'content_cut'
        }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [ScopeGuard],
        data: {
          scope: 'scope_settings',
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
