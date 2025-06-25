import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Service } from '../../../models/Service';


@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private apiUrl = environment.apiUrl;

  private servicesSubject = new BehaviorSubject<Service[]>([]);
  services$ = this.servicesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllServices(tenant: string): Observable<Service[]> {
    if(this.servicesSubject.value.length > 0) {
      console.log('RETURNING CACHED SERVICES');
      return this.services$;
    }

    const params = new HttpParams().set('tenant', tenant);

    return this.http.get<Service[]>(`${this.apiUrl}/services`, { params }).pipe(
      tap((services) => {
        this.servicesSubject.next(services);
        console.log('FETCHED SERVICES');
      })
    );
  }

  getServiceById(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/services/${id}`);
  }

  createService(service: Service): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services`, service).pipe
      (
        tap((newService) => {
          const list = this.servicesSubject.value;
          this.servicesSubject.next([...list, newService]);
        })
      );
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`).pipe(
      tap(() => {
        const list = this.servicesSubject.value.filter((s) => s._id !== id);
        this.servicesSubject.next(list);
      })
    )
  }

  updateService(id: string, service: Service): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/services/${id}`, service).pipe(
      tap((updated) => {
        const list = this.servicesSubject.value.map((s) =>
          s._id === id ? updated : s
        );
        this.servicesSubject.next(list);
      })
    );
  }
}
