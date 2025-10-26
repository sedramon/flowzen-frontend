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

  // Client self-service methods
  getClientAppointments(clientId: string, tenantId: string): Observable<Appointment[]> {
    const params = { client: clientId, tenant: tenantId };
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`, { params });
  }

  cancelAppointment(appointmentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/appointments/${appointmentId}`);
  }

  // ============================================
  // WAITLIST METHODS
  // ============================================
  
  /**
   * Dodaje klijenta na listu čekanja.
   * Koristi se kada termin nije dostupan ali klijent želi da čeka.
   */
  addToWaitlist(waitlistData: any) {
    return this.http.post(`${this.apiUrl}/appointments/waitlist`, {
      ...waitlistData,
      tenant: this.tenantId
    });
  }

  /**
   * Vraća sve waitlist entries za određenog klijenta.
   * Prikazuje se u client dashboard-u.
   */
  getClientWaitlist(clientId: string): Observable<any[]> {
    const params = { tenant: this.tenantId };
    return this.http.get<any[]>(`${this.apiUrl}/appointments/waitlist/client/${clientId}`, { params });
  }

  /**
   * Uklanja klijenta sa liste čekanja.
   * Koristi se kada klijent više ne želi da čeka.
   */
  removeFromWaitlist(waitlistId: string, clientId: string) {
    const params = { clientId, tenant: this.tenantId };
    return this.http.delete(`${this.apiUrl}/appointments/waitlist/${waitlistId}`, { params });
  }

  /**
   * Prihvata termin sa liste čekanja.
   * Poziva se sa claimToken koji je dobijen email notifikacijom.
   * Kreira appointment i uklanja sve ostale sa liste za taj time slot.
   */
  claimAppointmentFromWaitlist(claimToken: string, clientId: string) {
    return this.http.post(`${this.apiUrl}/appointments/waitlist/claim`, {
      claimToken,
      clientId
    });
  }
}
