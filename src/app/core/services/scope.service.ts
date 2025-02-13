import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environmentDev } from "../../../environments/environment";
import { Scope } from "../../models/Scope";
import { BehaviorSubject, Observable, tap } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ScopeService {
    private scopesSubject = new BehaviorSubject<Scope[]>([]);
    public scopes$ = this.scopesSubject.asObservable();

  constructor(private http: HttpClient) { }

  fetchScopes(): Observable<Scope[]> {
    return this.http.get<Scope[]>(`${environmentDev.apiUrl}/scopes`).pipe(
      tap((scopes) => this.scopesSubject.next(scopes))
    )
  }

  getCurrentScopes(): Scope[] {
    return this.scopesSubject.getValue();
  }
}