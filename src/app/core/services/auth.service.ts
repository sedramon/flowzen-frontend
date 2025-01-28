import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { AuthenticatedUser } from '../../models/AuthenticatedUser';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'access_token';

  private userSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromToken();
  }

  login(email: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.http.post(`${this.apiUrl}/auth/login`, { email, password }).subscribe({
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

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decodedToken: { exp: number } = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return decodedToken.exp > now;
    } catch {
      this.clearToken();
      return false;
    }
  }

  private setUserFromToken(token: string): void {
    try {
      const decodedToken: AuthenticatedUser = jwtDecode<AuthenticatedUser>(token);
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

}
