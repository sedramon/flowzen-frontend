import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { CreateAndUpdateSupplierDto, Supplier } from "../../../models/Supplier";

@Injectable({
    providedIn: "root",
})
export class SuppliersService {
    private apiUrl = environment.apiUrl;

    private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
    public suppliers$ = this.suppliersSubject.asObservable();

    constructor(private http: HttpClient) { }

    getAllSuppliers(tenant: string): Observable<Supplier[]> {
        const params = new HttpParams().set('tenant', tenant);

        return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`, {params}).pipe(
            tap((suppliers) => {
                console.log(suppliers);
                this.suppliersSubject.next(suppliers);
            })
        )
    }

    getOneSupplierById(id: string): Observable<Supplier> {
        return this.http.get<Supplier>(`${this.apiUrl}/suppliers/${id}`);
    }

    deleteSupplier(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/suppliers/${id}`).pipe(
            tap(() => {
                const filteredSuppliers = this.suppliersSubject.value.filter((supplier) => supplier._id !== id)
                this.suppliersSubject.next(filteredSuppliers);
            })
        )
    }

    createSupplier(createSupplierDto: CreateAndUpdateSupplierDto): Observable<Supplier> {
        return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, createSupplierDto).pipe(
            tap((newSupplier) => {
                const suppliers = this.suppliersSubject.value;
                this.suppliersSubject.next([...suppliers, newSupplier]);
            })
        )
    }

    updateSupplier(id: string, updateSupplierDto: CreateAndUpdateSupplierDto): Observable<Supplier> {
        return this.http.put<Supplier>(`${this.apiUrl}/suppliers/${id}`, updateSupplierDto).pipe(
            tap((updatedSupplier) => {
                const suppliers = this.suppliersSubject.value.map((supplier) => supplier._id === id ? updatedSupplier : supplier);
                this.suppliersSubject.next(suppliers);
            })
        )
    }
}