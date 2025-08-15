import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { Facility } from "../../../models/Facility";
import { HttpClient, HttpParams } from "@angular/common/http";
import { EffectiveSettings, RawSettings, UpsertSettingsDto } from "../../../models/Settings";

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    private apiUrl = environment.apiUrl;

    private facilitiesSubject = new BehaviorSubject<Facility[]>([]);
    facilities$ = this.facilitiesSubject.asObservable();

    constructor(private http: HttpClient) { }

    getAllFacilities(tenant: string): Observable<Facility[]> {
        if (this.facilitiesSubject.value.length > 0) {
            console.log('RETURNING CACHED FACILITIES');
            return this.facilities$;
        }

        const params = new HttpParams().set('tenant', tenant);

        return this.http.get<Facility[]>(`${this.apiUrl}/facility`, { params }).pipe(
            tap((facilities) => {
                this.facilitiesSubject.next(facilities);
                console.log('FETCHED FACILITIES');
            })
        )
    }

    getFacilityById(id: number): Observable<Facility> {
        return this.http.get<Facility>(`${this.apiUrl}/facility/${id}`);
    }

    createFacility(facility: Facility): Observable<Facility> {
        return this.http.post<Facility>(`${this.apiUrl}/facility`, facility).pipe(
            tap((newFacility) => {
                const list = this.facilitiesSubject.value;
                this.facilitiesSubject.next([...list, newFacility]);
            })
        );
    }

    updateFacility(id: string, facility: Facility): Observable<Facility> {
        return this.http.put<Facility>(`${this.apiUrl}/facility/${id}`, facility).pipe(
            tap((updated) => {
                const list = this.facilitiesSubject.value.map((f) =>
                    f._id === id ? updated : f
                );
                this.facilitiesSubject.next(list);
            })
        );
    }

    deleteFacility(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/facility/${id}`).pipe(
            tap(() => {
                const list = this.facilitiesSubject.value.filter((f) => f._id !== id);
                this.facilitiesSubject.next(list);
            })
        );
    }

    getEffectiveSettings(tenantId: string, userId: string): Observable<EffectiveSettings> {
        const params = new HttpParams().set('tenant', tenantId).set('user', userId);
        return this.http.get<EffectiveSettings>(`${this.apiUrl}/settings`, { params });
    }

    getTenantSettingsRaw(tenantId: string): Observable<RawSettings> {
        const params = new HttpParams().set('tenant', tenantId);
        return this.http.get<RawSettings>(`${this.apiUrl}/settings/tenant`, { params });
    }

    getUserSettingsRaw(tenantId: string, userId: string): Observable<RawSettings> {
        const params = new HttpParams().set('tenant', tenantId).set('user', userId);
        return this.http.get<RawSettings>(`${this.apiUrl}/settings/user`, { params });
    }

    upsertSettings(dto: UpsertSettingsDto): Observable<RawSettings> {
        return this.http.put<RawSettings>(`${this.apiUrl}/settings`, dto);
    }

    upsertTenantSettings(tenantId: string, payload: Partial<EffectiveSettings>) {
        const body = {
            tenant: tenantId,
            type: 'tenant',
            user: null,
            ...payload
        };
        return this.http.put(`${this.apiUrl}/settings`, body);
    }

    upsertUserSettings(tenantId: string, userId: string, payload: Partial<EffectiveSettings>) {
        const body = {
            tenant: tenantId,
            type: 'user',
            user: userId,
            ...payload
        };
        return this.http.put(`${this.apiUrl}/settings`, body);
    }
}