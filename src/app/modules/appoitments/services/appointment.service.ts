import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { Appointment, UpdateAndCreateAppointmentDto } from '../../../models/Appointment';
import { SettingsService } from '../../settings/services/settings.service';
import { Facility } from '../../../models/Facility';
import { Employee } from '../../../models/Employee';

export interface ScheduleData {
  employees: Employee[];
  appointments: Appointment[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = environment.apiUrl;
  private tenantId: string;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.tenantId = currentUser?.tenant || '';
  }

  createAppointment(appointment: UpdateAndCreateAppointmentDto) {
    return this.http.post(`${this.apiUrl}/appointments`, {
      ...appointment,
      tenant: this.tenantId
    });
  }

  bulkCreateAppointments(appointments: UpdateAndCreateAppointmentDto[]) {
    return this.http.post(`${this.apiUrl}/appointments/bulk`, {
      appointments: appointments.map(a => ({ ...a, tenant: this.tenantId }))
    });
  }

  updateAppointment(id: string, appointment: any) {
    return this.http.put(`${this.apiUrl}/appointments/${id}`, appointment);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${id}`);
  }

  getAllAppoitements(facility?: string, date?: string): Observable<any[]> {
    const params: any = { tenant: this.tenantId };
    if (facility) {
      params.facility = facility;
    }
    if (date) {
      params.date = date;
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/appointments`, { params });
  }

  getFacilities(): Observable<Facility[]> {
    return this.settingsService.getAllFacilities(this.tenantId);
  }

  getScheduleSimple(date: Date, facility?: string): Observable<ScheduleData> {
    const selectedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const employees$ = this.getEmployeesWithWorkingShift(selectedDate, facility);
    const appointments$ = this.getAllAppoitements(facility, selectedDate);

    return employees$.pipe(
      map(employees => {
        return employees
          .filter(e => e.includeInAppoitments)
          .map(e => ({
            ...e,
            avatarUrl: e.avatarUrl ? this.apiUrl + e.avatarUrl : undefined
          }))
      }),
      switchMap(filteredEmployees =>
        appointments$.pipe(
          map(appointments => ({
            employees: filteredEmployees,
            appointments: appointments.map(app => ({
              id: app.id,
              employee: app.employee,
              client: app.client,
              service: app.service,
              facility: app.facility,
              tenant: app.tenant,
              startHour: app.startHour,
              endHour: app.endHour,
              date: app.date,
              paid: app.paid,
              sale: app.sale
            }))
          }))
        )
      )
    );
  }

  getEmployeesWithWorkingShift(date: string, facility?: string): Observable<any[]> {
    const params: any = {
      tenant: this.tenantId,
      date
    };
    
    if (facility) {
      params.facility = facility;
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/employees/with-working-shift`, { params });
  }
}
