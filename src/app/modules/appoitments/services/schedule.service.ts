import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Employee {
  id: number;
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
  employees: Employee[];
  appointments: Appointment[];
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor() {}

  getSchedule(date: Date): Observable<ScheduleData> {
    const selectedDate = date.toISOString().split('T')[0];

    const allEmployees: Employee[] = [
      { id: 1, name: 'Milan',  avatarUrl: 'https://i.pravatar.cc/50?u=Milan', workingDays: ['2025-04-16', '2025-04-18'] },
      { id: 2, name: 'Jovana', avatarUrl: 'https://i.pravatar.cc/50?u=Jovana', workingDays: ['2025-04-17', '2025-04-19'] },
      { id: 3, name: 'Petar',  avatarUrl: 'https://i.pravatar.cc/50?u=Petar', workingDays: ['2025-04-16', '2025-04-17'] },
      { id: 4, name: 'Ana',    avatarUrl: 'https://i.pravatar.cc/50?u=Ana', workingDays: ['2025-04-16', '2025-04-18'] },
      { id: 5, name: 'Marko',  avatarUrl: 'https://i.pravatar.cc/50?u=Marko', workingDays: ['2025-04-17', '2025-04-19'] },
      { id: 6, name: 'Ivana',  avatarUrl: 'https://i.pravatar.cc/50?u=Ivana', workingDays: ['2025-04-16', '2025-04-17'] },
      { id: 7, name: 'Stefan', avatarUrl: 'https://i.pravatar.cc/50?u=Stefan', workingDays: ['2025-04-18', '2025-04-19'] },
      { id: 8, name: 'Marija', avatarUrl: 'https://i.pravatar.cc/50?u=Marija', workingDays: ['2025-04-16', '2025-04-17'] }
    ];

    const allAppointments: Appointment[] = [
      { id: 101, employeeId: 1, startHour: 8,  endHour: 10, serviceName: 'Sisanje', date: '2025-04-16' },
      { id: 102, employeeId: 2, startHour: 9,  endHour: 10, serviceName: 'Brijanje', date: '2025-04-17' },
      { id: 104, employeeId: 2, startHour: 11, endHour: 12, serviceName: 'Farbanje', date: '2025-04-17' },
      { id: 104, employeeId: 3, startHour: 15, endHour: 17, serviceName: 'Sisanje', date: '2025-04-16' },
      { id: 105, employeeId: 1, startHour: 18, endHour: 20, serviceName: 'Brijanje', date: '2025-04-16' },
      { id: 106, employeeId: 1, startHour: 14, endHour: 15, serviceName: 'Farbanje', date: '2025-04-18' },
      { id: 107, employeeId: 4, startHour: 10, endHour: 11, serviceName: 'Sisanje', date: '2025-04-16' },
      { id: 108, employeeId: 5, startHour: 12, endHour: 13, serviceName: 'Brijanje', date: '2025-04-17' },
      { id: 109, employeeId: 6, startHour: 9,  endHour: 11, serviceName: 'Farbanje', date: '2025-04-16' },
      { id: 110, employeeId: 7, startHour: 16, endHour: 18, serviceName: 'Sisanje', date: '2025-04-19' },
      { id: 111, employeeId: 8, startHour: 8,  endHour: 9,  serviceName: 'Brijanje', date: '2025-04-16' },
      { id: 112, employeeId: 8, startHour: 13, endHour: 14, serviceName: 'Farbanje', date: '2025-04-17' }
    ];

    // const employees = allEmployees.filter(emp => emp.workingDays.includes(selectedDate));
    const employees = allEmployees; 
    const appointments = allAppointments.filter(app => app.date === selectedDate);


    return of({ employees, appointments});
  }
}
