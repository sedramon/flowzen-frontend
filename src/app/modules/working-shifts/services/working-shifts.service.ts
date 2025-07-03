import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environmentDev } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkingShiftsService {
  private apiUrl = environmentDev.apiUrl;

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
}
