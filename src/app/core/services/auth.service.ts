import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { AuthenticatedUser } from '../../models/AuthenticatedUser';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';

  private userSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromToken();
  }

  login(email: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/auth/login`, { email, password })
        .subscribe({
          next: (response: any) => {
            const token = response.access_token;
            this.saveToken(token);
            this.setUserFromToken(token);

            // Redirekcija nakon prijave
            const returnUrl = localStorage.getItem('returnUrl') || '/home'; // Preuzmi returnUrl ili default na /home
            localStorage.removeItem('returnUrl'); // Očisti returnUrl
            this.router.navigate([returnUrl]);

            observer.next(response);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
    });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        this.clearToken();
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearToken();
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      },
    });
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  updateCurrentUser(updatedUser: AuthenticatedUser): void {
    this.userSubject.next(updatedUser);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decodedToken: { exp: number } = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decodedToken.exp < now) {
        this.clearToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      this.clearToken(); // Clear corrupted token
      return false;
    }
  }

  private setUserFromToken(token: string): void {
    try {
      const decodedToken: AuthenticatedUser =
        jwtDecode<AuthenticatedUser>(token);
      this.userSubject.next(decodedToken);
    } catch {
      this.userSubject.next(null);
    }
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      this.setUserFromToken(token);
    }
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.userSubject.getValue();
  }

  getScopes(): string[] {
    const user = this.userSubject.getValue();
    const availableScopes = user?.role?.availableScopes || [];
    return availableScopes.map((scope) => scope.name);
  }

  isModuleEnabled(moduleName: string): boolean {
  const scopes = this.getScopes();

  const normalizedScopes = scopes.map(s => s.toLowerCase().trim());
  const normalizedModule = moduleName.toLowerCase().trim();

  const has = normalizedScopes.includes(normalizedModule);

  return has;
}

}
