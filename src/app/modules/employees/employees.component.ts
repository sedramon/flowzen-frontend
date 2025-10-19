import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { EmployeesService } from './services/employees.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Employee } from '../../models/Employee';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddEmployeeDialogComponent } from './dialogs/add-employee-dialog/add-employee-dialog.component';
import { EditEmployeeDialogComponent } from './dialogs/edit-employee-dialog/edit-employee-dialog.component';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FlexLayoutModule, CommonModule, MatPaginatorModule, MatTableModule, MatSortModule, MatIconModule, MatIconButton, MatDividerModule, MatSnackBarModule, MatChipsModule, MatDividerModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
  animations: [
    trigger('expandSearch', [
      state('collapsed', style({ width: '0px', padding: '0px', opacity: 0 })),
      state('expanded', style({ width: '250px', padding: '15px', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class EmployeesComponent implements OnInit {
  employees$: Observable<Employee[]> = of([]);
  filteredEmployees$: Observable<Employee[]> = of([]);
  searchExpanded = false;
  searchQuery = '';
  apiUrl = environment.apiUrl;

  constructor(private employeeService: EmployeesService, private dialog: MatDialog, private snackBar: MatSnackBar, private authService: AuthService) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      // Ako iz nekog razloga korisnik nije dostupan, uradi fallback (npr. redirect ili error)
      return;
    }

    // Get the cached employees observable
    this.employees$ = this.employeeService.employees$;

     // Trigger the initial fetch if not already loaded
     this.employeeService.getAllEmployees(currentUser.tenant!).subscribe();

 
     // Initialize filtered employees
     this.filteredEmployees$ = this.employees$;
  }

  toggleSearch() {
    this.searchExpanded = !this.searchExpanded;
    if (!this.searchExpanded) {
      this.searchQuery = ''; // Reset search when closing
    }
  }

  // Computed property to filter employees dynamically
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
      width: '750px',
      height: '950px',
    });

    dialogRef.afterClosed().subscribe((employee) => {
      if (employee) {
        this.employeeService.createEmployee(employee).subscribe(
          () => {
            this.showSnackbar(`Employee "${employee.firstName} ${employee.lastName}" created successfully`);
          },
          (error) => {
            console.error('Error creating employee:', error);
            this.showSnackbar('Failed to create employee', true);
          }
        );
      }
    });
  }

  openEditEmployeeDialog(employee: Employee) {
    const dialogRef = this.dialog.open(EditEmployeeDialogComponent, {
      width: '750px',
      height: '950px',
      data: { employee }
    });

    dialogRef.afterClosed().subscribe((updatedEmployee) => {
      if (updatedEmployee) {
        this.employeeService.updateEmployee(employee._id!, updatedEmployee).subscribe(
          () => {
            this.showSnackbar(`Employee "${updatedEmployee.firstName} ${updatedEmployee.lastName}" updated successfully`);
          },
          (error) => {
            console.error('Error updating employee:', error);
            this.showSnackbar('Failed to update employee', true);
          }
        );
      }
    });
  }

  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000, // 3 seconds
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success'] // Ensure it's an array
    });
  }
}
