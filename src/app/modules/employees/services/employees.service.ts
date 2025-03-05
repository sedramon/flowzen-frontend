import { Injectable } from "@angular/core";
import { environmentDev } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Employee } from "../../../models/Employee";

@Injectable({
    providedIn: "root",
})
export class EmployeesService {
    private apiUrl = environmentDev.apiUrl;

    constructor(private http: HttpClient) {}

    getAllEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.apiUrl}/employees`);
    }

    getEmployeeById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/employees/${id}`);
    }

    createEmployee(employee: Employee): Observable<Employee> {
        return this.http.post<Employee>(`${this.apiUrl}/employees`, employee);
    }
}