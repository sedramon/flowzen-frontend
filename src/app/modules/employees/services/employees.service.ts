import { Injectable } from "@angular/core";
import { environmentDev } from "../../../../environments/environment";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Employee } from "../../../models/Employee";

@Injectable({
    providedIn: "root",
})
export class EmployeesService {
    private apiUrl = environmentDev.apiUrl;

    // Initialize with an empty array to ensure consistent typing
    private employeesSubject = new BehaviorSubject<Employee[]>([]);
    employees$ = this.employeesSubject.asObservable();

    constructor(private http: HttpClient) {}

    getAllEmployees(tenant: string): Observable<Employee[]> {
         // If cached data exists and is not empty, return it
         if (this.employeesSubject.value.length > 0) {
            console.log("RETURNING CACHED EMPLOYEES")
            return this.employees$;
        }

        const params = new HttpParams().set('tenant', tenant);

        // If no cached data, make the API call and update the BehaviorSubject
        return this.http.get<Employee[]>(`${this.apiUrl}/employees`, { params }).pipe(
            tap((employees) => {
                this.employeesSubject.next(employees)
                console.log("FETCHED EMPLOYEES")
            })
        );
    }

    getEmployeeById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`);
    }

    createEmployee(employee: Employee): Observable<Employee> {
        return this.http.post<Employee>(`${this.apiUrl}/employees`, employee).pipe(
            tap((newEmployee) => {
                const list = this.employeesSubject.value;
                this.employeesSubject.next([...list, newEmployee]);
            })
        )
    }

    updateEmployee(id: string, employee: Employee): Observable<Employee> {
        return this.http.put<Employee>(`${this.apiUrl}/employees/${id}`, employee).pipe(
            tap((updated) => {
                const list = this.employeesSubject.value.map((e) =>
                    e._id === id ? updated : e
                );
                this.employeesSubject.next(list);
            })
        );
    }

    uploadAvatar(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('file', file);
        // Pravi URL: http://localhost:3000/employees/upload
        return this.http.post<{ url: string }>(`${this.apiUrl}/employees/upload`, formData);
    }

    deleteEmployee(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/employees/${id}`).pipe(
            tap(() => {
                const list = this.employeesSubject.value.filter((e) => e._id !== id);
                this.employeesSubject.next(list);
            })
        );
    }

}