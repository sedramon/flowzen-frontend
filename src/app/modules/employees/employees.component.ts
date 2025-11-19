import { Component, OnInit } from '@angular/core';
import { EmployeesService } from './services/employees.service';
import { CommonModule } from '@angular/common';
import { Employee } from '../../models/Employee';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddEmployeeDialogComponent } from './dialogs/add-employee-dialog/add-employee-dialog.component';
import { EditEmployeeDialogComponent } from './dialogs/edit-employee-dialog/edit-employee-dialog.component';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ChipModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AvatarModule,
    ToastModule,
    BadgeModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
  employees$: Observable<Employee[]> = of([]);
  filteredEmployees$: Observable<Employee[]> = of([]);
  searchQuery = '';
  apiUrl = environment.apiUrl;

  constructor(
    private employeeService: EmployeesService, 
    private dialog: MatDialog, 
    private messageService: MessageService, 
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    // Get the cached employees observable
    this.employees$ = this.employeeService.employees$;

     // Trigger the initial fetch if not already loaded
     this.employeeService.getAllEmployees(this.authService.requireCurrentTenantId()).subscribe();

 
     // Initialize filtered employees
     this.filteredEmployees$ = this.employees$;
  }

  // Filter employees dynamically
  filterEmployees() {
    this.filteredEmployees$ = this.employees$.pipe(
      map(employees => employees.filter(emp => {
        const query = this.searchQuery.toLowerCase().trim();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        return (
          emp.firstName.toLowerCase().includes(query) ||
          emp.lastName.toLowerCase().includes(query) ||
          fullName.includes(query) ||
          emp.jobRole.toLowerCase().includes(query) ||
          emp.contactEmail.toLowerCase().includes(query)
        );
      }))
    );
  }

  openAddEmployeeDialog() {
    const dialogRef = this.dialog.open(AddEmployeeDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
    });

    dialogRef.afterClosed().subscribe((employee) => {
      if (employee) {
        this.employeeService.createEmployee(employee).subscribe(
          () => {
            this.showToast(`Zaposleni "${employee.firstName} ${employee.lastName}" uspešno kreiran`);
          },
          (error) => {
            console.error('Error creating employee:', error);
            this.showToast('Neuspešno kreiranje zaposlenog', true);
          }
        );
      }
    });
  }

  openEditEmployeeDialog(employee: Employee) {
    const dialogRef = this.dialog.open(EditEmployeeDialogComponent, {
      panelClass: 'admin-dialog-panel',
      backdropClass: 'custom-backdrop',
      data: { employee }
    });

    dialogRef.afterClosed().subscribe((updatedEmployee) => {
      if (updatedEmployee) {
        this.employeeService.updateEmployee(employee._id!, updatedEmployee).subscribe(
          () => {
            this.showToast(`Zaposleni "${updatedEmployee.firstName} ${updatedEmployee.lastName}" uspešno ažuriran`);
          },
          (error) => {
            console.error('Error updating employee:', error);
            this.showToast('Neuspešno ažuriranje zaposlenog', true);
          }
        );
      }
    });
  }

  showToast(message: string, isError: boolean = false) {
    this.messageService.add({
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Greška' : 'Uspešno',
      detail: message,
      life: 3000
    });
  }
}
