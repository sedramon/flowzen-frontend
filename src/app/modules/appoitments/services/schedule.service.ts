import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EmployeesService } from '../../employees/services/employees.service';
import { Employee } from '../../../models/Employee';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export interface Appointment {
  id: string; // string now
  employeeId: string; // string now
  startHour: number;
  endHour: number;
  serviceName: string;
  date: string;
}

export interface ScheduleData {
  employees: Employee[];
  appointments: Appointment[];
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = environment.apiUrl;

  employees$: Observable<Employee[]> = of([]);
  employeesDb: Employee[] = [];
  private tenantId: string;

  constructor(
    private employeesService: EmployeesService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.tenantId = currentUser?.tenant || '';
    this.employees$ = this.employeesService.employees$;
    this.employeesService.getAllEmployees(this.tenantId).subscribe();
    this.employees$.subscribe(list => (this.employeesDb = list));
  }

  createAppointment(appointment: Appointment) {
    return this.http.post(`${this.apiUrl}/appointments`, {
      ...appointment,
      tenantId: this.tenantId
    });
  }

  updateAppointment(id: string, appointment: Appointment) {
    return this.http.put(`${this.apiUrl}/appointments/${id}`, {
      ...appointment,
      tenantId: this.tenantId
    });
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${id}`);
  }

  getAllAppoitements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/appointments`, {
      params: { tenantId: this.tenantId }
    });
  }

  getScheduleSimple(date: Date): Observable<ScheduleData> {
    const selectedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const employees$ = this.getEmployeesWithWorkingShift(selectedDate);
    const appointments$ = this.getAllAppoitements().pipe(
      map(appointments => {
        if (appointments.length > 0) {
          console.log('Fetched appointments:', appointments);
          return appointments;
        } else {
          console.log('No appointments found.');
          return [];
        }
      })
    );

    return employees$.pipe(
      map(employees => {
        console.log('Employees with working shift:', employees); // <-- LOGUJ OVDE
        return employees
          .filter(e => e.includeInAppoitments)
          .map(e => ({
            ...e,
            avatarUrl: e.avatarUrl ? this.apiUrl + e.avatarUrl : undefined
          }))
      }),
      switchMap(filteredEmployees =>
        appointments$.pipe(
          map(appointments => {
            console.log('All appointments from backend:', appointments);
            return ({
              employees: filteredEmployees,
              appointments: appointments
                .filter(app => {
                  const match = app.date === selectedDate;
                  if (!match) {
                    console.log('Filtered out:', app.date, '!==', selectedDate, app);
                  }
                  return match;
                })
                .map(app => ({
                  id: typeof app.id === 'string' ? app.id : app.id?.toString() ?? app._id?.toString() ?? '',
                  employeeId: typeof app.employeeId === 'string'
                    ? app.employeeId
                    : app.employeeId?._id ?? '',
                  startHour: app.startHour,
                  endHour: app.endHour,
                  serviceName: app.serviceName,
                  date: app.date
                }))
            })
          })
        )
      )
    );
  }

  getEmployeesWithWorkingShift(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees/with-working-shift`, {
      params: {
        tenant: this.tenantId,
        date
      }
    });
  }
}
