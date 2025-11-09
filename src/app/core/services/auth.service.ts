import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private readonly debugAuth = environment.debugAuth === true;

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
    this.log('login:start', { email });
    return new Observable((observer) => {
      this.http
        .post(`${this.apiUrl}/auth/login`, { email, password }, { 
          observe: 'response',
          withCredentials: true 
        })
        .subscribe({
          next: (response: HttpResponse<any>) => {
            const body = response.body;
            this.log('login:response', {
              status: response.status,
              hasBody: !!body,
              hasUser: !!body?.user,
            });
            
            const csrfToken = response.headers.get('X-CSRF-Token');
            if (csrfToken) {
              this.log('login:csrf-received', { tokenPrefix: csrfToken.substring(0, 12) });
              this.csrfService.setToken(csrfToken);
            }

            // Store user data from response body
            if (body && body.user) {
              const scopes: string[] = Array.isArray(body.user.scopes)
                ? body.user.scopes
                : [];

              const tenantRaw = body.user.tenant ?? null;
              const tenantInfo =
                tenantRaw && typeof tenantRaw === 'object' ? tenantRaw : null;
              const tenantId =
                typeof tenantRaw === 'string'
                  ? tenantRaw
                  : tenantInfo?._id ?? null;

              const user: AuthenticatedUser = {
                userId: body.user.userId,
                tenant: tenantId ?? undefined,
                tenantId,
                tenantInfo,
                email: body.user.email,
                username: body.user.username || body.user.email,
                name: body.user.name,
                role: body.user.role,
                scopes,
                isGlobalAdmin: body.user.isGlobalAdmin === true,
              };

              this.saveUser(user);
              this.userSubject.next(user);
              this.log('login:user-normalized', {
                userId: user.userId,
                tenantId: user.tenantId,
                isGlobalAdmin: user.isGlobalAdmin,
                scopesCount: Array.isArray(user.scopes) ? user.scopes.length : 0,
              });
            }

            const storedReturnUrl = localStorage.getItem('returnUrl');
            localStorage.removeItem('returnUrl');

            const currentUser = this.userSubject.getValue();
            const defaultRoute = this.resolveDefaultRoute(currentUser, storedReturnUrl);

            this.log('login:navigate', { target: defaultRoute, storedReturnUrl });
            this.router.navigate([defaultRoute]);

            observer.next(body);
            observer.complete();
          },
          error: (err) => {
            this.log('login:error', this.serializeError(err));
            observer.error(err);
          },
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
    const tenantInfo =
      user.tenantInfo ??
      (typeof user.tenant === 'object' && user.tenant !== null
        ? (user.tenant as any)
        : null);
    const tenantId =
      user.tenantId ??
      (typeof user.tenant === 'string' ? user.tenant : tenantInfo?._id ?? null);

    const normalizedUser: AuthenticatedUser = {
      ...user,
      tenant: tenantId ?? undefined,
      tenantId: tenantId ?? null,
      tenantInfo: tenantInfo ?? null,
      scopes: Array.isArray(user.scopes) ? user.scopes : [],
      isGlobalAdmin: user.isGlobalAdmin === true,
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    this.log('state:save-user', {
      userId: normalizedUser.userId,
      tenantId: normalizedUser.tenantId,
      scopesCount: Array.isArray(normalizedUser.scopes) ? normalizedUser.scopes.length : 0,
      isGlobalAdmin: normalizedUser.isGlobalAdmin,
    });
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
    this.log('state:clear-session');
  }

  updateCurrentUser(updatedUser: AuthenticatedUser): void {
    this.saveUser(updatedUser);
    this.userSubject.next(updatedUser);
    this.log('state:update-user', {
      userId: updatedUser.userId,
      tenantId: updatedUser.tenantId,
      scopesCount: updatedUser.scopes?.length ?? 0,
    });
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
      const tenantInfo =
        user.tenantInfo ??
        (typeof (user as any).tenantInfo === 'object'
          ? (user as any).tenantInfo
          : null);
      const tenantId =
        user.tenantId ??
        (typeof user.tenant === 'string'
          ? user.tenant
          : tenantInfo?._id ?? null);

      const normalized: AuthenticatedUser = {
        ...user,
        tenant: tenantId ?? undefined,
        tenantId: tenantId ?? null,
        tenantInfo: tenantInfo ?? null,
        scopes: Array.isArray(user.scopes) ? user.scopes : [],
        isGlobalAdmin: user.isGlobalAdmin === true,
      };
      this.userSubject.next(normalized);
      this.log('state:load-from-storage', {
        userId: normalized.userId,
        tenantId: normalized.tenantId,
        isGlobalAdmin: normalized.isGlobalAdmin,
        scopesCount: Array.isArray(normalized.scopes) ? normalized.scopes.length : 0,
      });
    }
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.userSubject.getValue();
  }

  getCurrentTenantId(): string | null {
    const user = this.userSubject.getValue();
    return user?.tenant ?? user?.tenantId ?? null;
  }

  requireCurrentTenantId(): string {
    const tenantId = this.getCurrentTenantId();
    if (!tenantId) {
      this.log('state:require-tenantId:error', { reason: 'missing tenantId' });
      throw new Error('Tenant ID is not available for the current user.');
    }
    this.log('state:require-tenantId:resolved', { tenantId });
    return tenantId;
  }

  getScopes(): string[] {
    const user = this.userSubject.getValue();
    return user?.scopes || [];
  }

  isGlobalAdmin(): boolean {
    return this.userSubject.getValue()?.isGlobalAdmin === true;
  }

  hasGlobalScope(scopeName: string): boolean {
    if (!scopeName) {
      return false;
    }

    const normalized = scopeName.toLowerCase().trim();
    const scopes = this.getScopes().map((scope) => scope.toLowerCase().trim());

    return this.isGlobalAdmin() && scopes.includes(normalized);
  }

  isModuleEnabled(moduleName: string): boolean {
    const scopes = this.getScopes();

    const normalizedScopes = scopes.map((s) => s.toLowerCase().trim());
    const normalizedModule = moduleName.toLowerCase().trim();

    const has = normalizedScopes.includes(normalizedModule);

    return has;
  }

  private resolveDefaultRoute(
    user: AuthenticatedUser | null,
    storedReturnUrl: string | null,
  ): string {
    if (storedReturnUrl && storedReturnUrl !== '/login') {
      if (user?.isGlobalAdmin && storedReturnUrl === '/home') {
        return '/admin/overview';
      }
      return storedReturnUrl;
    }

    if (user?.isGlobalAdmin) {
      return '/admin/overview';
    }

    return '/home';
  }

  private log(message: string, payload?: unknown): void {
    if (!this.debugAuth) {
      return;
    }
    if (payload !== undefined) {
      console.info(`[AuthService] ${message}`, payload);
    } else {
      console.info(`[AuthService] ${message}`);
    }
  }

  private serializeError(
    error: unknown,
  ): {
    message: string;
    status?: number;
    details?: unknown;
  } {
    if (!error) {
      return { message: 'Unknown error' };
    }
    if (error instanceof Error) {
      return { message: error.message };
    }
    if (typeof error === 'object' && error !== null) {
      const maybeStatus = (error as any).status;
      const maybeMessage = (error as any).message;
      return {
        message: maybeMessage ? String(maybeMessage) : 'Unhandled error object',
        status: typeof maybeStatus === 'number' ? maybeStatus : undefined,
      };
    }
    return { message: 'Unhandled error', details: error };
  }

}
