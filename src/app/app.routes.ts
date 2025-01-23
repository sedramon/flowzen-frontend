import { Routes } from '@angular/router';
import { HomeComponent } from './modules/home/home.component';
import { LoginComponent } from './modules/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { AppoitmentsComponent } from './modules/appoitments/appoitments.component';
import { ClientsComponent } from './modules/clients/clients.component';
import { EmployeesComponent } from './modules/employees/employees.component';

export const routes: Routes = [
    {
      path: '',
      component: LayoutComponent, // Parent route with the layout
      canActivate: [AuthGuard],   // Protect routes with AuthGuard
      children: [
        { path: 'home', component: HomeComponent },
        { path: '', redirectTo: 'home', pathMatch: 'full' },
        { path: 'appoitments', component: AppoitmentsComponent },
        { path: 'clients', component: ClientsComponent },
        { path: 'employees', component: EmployeesComponent },
      ],
    },
    { path: 'login', component: LoginComponent }, // Login route without the layout
    { path: '**', redirectTo: 'login' },          // Redirect unknown routes to login
  ];
