import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkingShiftsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllShifts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/working-shifts`);
  }

  createShift(shift: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/working-shifts`, shift);
  }

  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/working-shifts/${id}`);
  }

  updateShift(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/working-shifts/${id}`, data);
  }

  upsertShift(shift: any) {
    return this.http.post<any>(`${this.apiUrl}/working-shifts/upsert`, shift);
  }

  deleteShiftByEmployeeDate(employeeId: string, date: string, tenantId: string) {
    return this.http.delete<any>(
      `${this.apiUrl}/working-shifts/by-employee-date?employeeId=${employeeId}&date=${date}&tenantId=${tenantId}`
    );
  }

  getShiftsForEmployeeMonth(employeeId: string, month: number, year: number, tenantId: string) {
    // month je 0-based
    return this.http.get<any[]>(`${this.apiUrl}/working-shifts`, {
      params: {
        employeeId,
        tenantId,
        month: month.toString(),
        year: year.toString()
      }
    });
  }
}
