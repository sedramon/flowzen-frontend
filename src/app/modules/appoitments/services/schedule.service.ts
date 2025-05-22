import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EmployeesService } from '../../employees/services/employees.service';
import { Employee } from '../../../models/Employee';
import { HttpClient } from '@angular/common/http';
import { environmentDev } from '../../../../environments/environment';

export interface EmployeeMock {
  _id: number;
  name: string;
  avatarUrl: string;
  workingDays: string[];
}

export interface Appointment {
  id: number;
  employeeId: number;
  startHour: number;
  endHour: number;
  serviceName: string;
  date: string;
}

export interface ScheduleData {
  employees: EmployeeMock[];
  appointments: Appointment[];
  employeesDb?: Employee[]; // Dodaj ovo
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = environmentDev.apiUrl;

  employees$: Observable<Employee[]> = of([]);

  /** NOVA varijabla – ovde će završiti sirovi podaci iz employees$  */
  employeesDb: Employee[] = [];

  constructor(
    private employeesService: EmployeesService,
    private http: HttpClient
  ) {
    const tenantId = '67bcf25a3311448ed3af993f';
    /* Podesi izvor strima */
    this.employees$ = this.employeesService.employees$;

    /* Povučeš podatke jednom, pa šta stigne smestiš u employeesDb */
    this.employeesService.getAllEmployees(tenantId).subscribe();      // okida fetch
    this.employees$.subscribe(list => (this.employeesDb = list));
  }

  createAppointment(appointment: Appointment) {
    return this.http.post(`${this.apiUrl}/appointments`, appointment);
  }

  updateAppointment(id: number, appointment: Appointment) {
    return this.http.put(`${this.apiUrl}/appointments/${id}`, appointment);
  }

  getAllAppoitements(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`);
  }

  getSchedule(date: Date): Observable<ScheduleData> {
    const selectedDate = date.toISOString().split('T')[0];

    const allEmployees: EmployeeMock[] = [
      { _id: 1, name: 'Milan',  avatarUrl: 'https://i.pravatar.cc/50?u=Milan', workingDays: ['2025-05-16', '2025-05-18'] },
      { _id: 2, name: 'Jovana', avatarUrl: 'https://i.pravatar.cc/50?u=Jovana', workingDays: ['2025-05-17', '2025-05-19'] },
      { _id: 3, name: 'Petar',  avatarUrl: 'https://i.pravatar.cc/50?u=Petar', workingDays: ['2025-05-16', '2025-05-17'] },
      { _id: 4, name: 'Ana',    avatarUrl: 'https://i.pravatar.cc/50?u=Ana', workingDays: ['2025-05-16', '2025-05-18'] },
      { _id: 5, name: 'Marko',  avatarUrl: 'https://i.pravatar.cc/50?u=Marko', workingDays: ['2025-05-17', '2025-05-19'] },
      { _id: 6, name: 'Ivana',  avatarUrl: 'https://i.pravatar.cc/50?u=Ivana', workingDays: ['2025-05-16', '2025-05-17'] },
      { _id: 7, name: 'Stefan', avatarUrl: 'https://i.pravatar.cc/50?u=Stefan', workingDays: ['2025-05-18', '2025-05-19'] },
      { _id: 8, name: 'Marija', avatarUrl: 'https://i.pravatar.cc/50?u=Marija', workingDays: ['2025-05-16', '2025-05-17'] }
    ];

    const allAppointments: Appointment[] = [
      { id: 101, employeeId: 1, startHour: 8,  endHour: 10, serviceName: 'Sisanje', date: '2025-05-16' },
      { id: 102, employeeId: 2, startHour: 9,  endHour: 10, serviceName: 'Brijanje', date: '2025-05-17' },
      { id: 105, employeeId: 2, startHour: 11, endHour: 12, serviceName: 'Farbanje', date: '2025-05-17' },
      { id: 105, employeeId: 3, startHour: 15, endHour: 17, serviceName: 'Sisanje', date: '2025-05-16' },
      { id: 105, employeeId: 1, startHour: 18, endHour: 20, serviceName: 'Brijanje', date: '2025-05-16' },
      { id: 106, employeeId: 1, startHour: 14, endHour: 15, serviceName: 'Farbanje', date: '2025-05-18' },
      { id: 107, employeeId: 4, startHour: 10, endHour: 11, serviceName: 'Sisanje', date: '2025-05-16' },
      { id: 108, employeeId: 5, startHour: 12, endHour: 13, serviceName: 'Brijanje', date: '2025-05-17' },
      { id: 109, employeeId: 6, startHour: 9,  endHour: 11, serviceName: 'Farbanje', date: '2025-05-16' },
      { id: 110, employeeId: 7, startHour: 16, endHour: 18, serviceName: 'Sisanje', date: '2025-05-19' },
      { id: 111, employeeId: 8, startHour: 8,  endHour: 9,  serviceName: 'Brijanje', date: '2025-05-16' },
      { id: 112, employeeId: 8, startHour: 13, endHour: 14, serviceName: 'Farbanje', date: '2025-05-17' }
    ];

    this.getAllAppoitements().subscribe(apps => {
      console.log("Fetched appointments from API:", apps);
    });

    // const employees = allEmployees.filter(emp => emp.workingDays.includes(selectedDate));
    const employees = allEmployees; 
    const appointments = allAppointments.filter(app => app.date === selectedDate);


    return of({ employees, appointments, employeesDb: this.employeesDb }); // Dodaj employees$ u rezultat
  }
}
