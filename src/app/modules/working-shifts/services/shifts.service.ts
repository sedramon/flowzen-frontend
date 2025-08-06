import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ShiftsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllShifts(tenant: string, facility?: string): Observable<any[]> {
    let url = `${this.apiUrl}/shifts?tenant=${tenant}`;
    if (facility) {
      url += `&facility=${facility}`;
    }
    return this.http.get<any[]>(url);
  }

  createShift(shift: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/shifts`, shift);
  }

  updateShift(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/shifts/${id}`, data);
  }

  deleteShift(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shifts/${id}`);
  }
}