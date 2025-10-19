import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticatedUser } from '../../models/AuthenticatedUser';
import { environment } from '../../../environments/environment';
import { CsrfService } from './csrf.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly USER_KEY = 'user_data';

  private userSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private csrfService: CsrfService
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/auth/login`, { email, password }, { 
          observe: 'response',
          withCredentials: true 
        })
        .subscribe({
          next: (response: HttpResponse<any>) => {
            const body = response.body;
            
            // Extract CSRF token from response headers
            const csrfToken = response.headers.get('X-CSRF-Token');
            console.log('📧 Login response headers:', response.headers.keys());
            console.log('🎫 CSRF Token from login:', csrfToken);
            if (csrfToken) {
              this.csrfService.setToken(csrfToken);
              console.log('✅ CSRF token stored in service');
            } else {
              console.error('❌ No CSRF token in login response!');
            }

            // Store user data from response body
            if (body && body.user) {
              const user: AuthenticatedUser = {
                userId: body.user.userId,
                tenant: body.user.tenant,
                email: body.user.email,
                name: body.user.name,
                role: body.user.role,
                scopes: body.user.scopes || []
              };
              console.log('user', user);
              this.saveUser(user);
              this.userSubject.next(user);
            }

            // Redirekcija nakon prijave
            const returnUrl = localStorage.getItem('returnUrl') || '/home';
            localStorage.removeItem('returnUrl');
            this.router.navigate([returnUrl]);

            observer.next(body);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
    });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails on backend, clear local session
        this.clearSession();
        this.router.navigate(['/login']);
      },
    });
  }

  /**
   * Save user data to localStorage
   * Note: JWT is in httpOnly cookie, we only store user info for UI purposes
   */
  private saveUser(user: AuthenticatedUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user data from localStorage
   */
  private getStoredUser(): AuthenticatedUser | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  /**
   * Clear all session data
   */
  private clearSession(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('returnUrl');
    this.csrfService.clearToken();
    this.userSubject.next(null);
  }

  updateCurrentUser(updatedUser: AuthenticatedUser): void {
    this.saveUser(updatedUser);
    this.userSubject.next(updatedUser);
  }

  /**
   * Check if user is logged in
   * Note: This checks if we have user data stored.
   * The backend validates the actual JWT from the httpOnly cookie.
   */
  isLoggedIn(): boolean {
    return this.userSubject.getValue() !== null;
  }

  /**
   * Load user data from localStorage on app initialization
   * Note: The actual authentication is validated by the backend via the httpOnly cookie
   */
  private loadUserFromStorage(): void {
    const user = this.getStoredUser();
    if (user) {
      this.userSubject.next(user);
    }
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.userSubject.getValue();
  }

  getScopes(): string[] {
    const user = this.userSubject.getValue();
    return user?.scopes || [];
  }

  isModuleEnabled(moduleName: string): boolean {
    const scopes = this.getScopes();

    const normalizedScopes = scopes.map(s => s.toLowerCase().trim());
    const normalizedModule = moduleName.toLowerCase().trim();

    const has = normalizedScopes.includes(normalizedModule);

    return has;
  }

}
