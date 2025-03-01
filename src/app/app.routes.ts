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
        path: 'clients',
        component: ClientsComponent,
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
          icon: 'miscellaneous_services'
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
          icon: 'lock' // optional
        }
      }
    ],
  },
  { path: 'login', component: LoginComponent }, // Login route without the layout
  { path: '**', redirectTo: 'login' }           // Redirect unknown routes to login
];
