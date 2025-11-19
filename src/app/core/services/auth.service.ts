import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticatedUser } from '../../models/AuthenticatedUser';
import { RoleTenantInfo } from '../../models/Role';
import { TenantAccessState } from '../../models/TenantAccessState';
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
  private accessRestrictionSubject = new BehaviorSubject<TenantAccessState | null>(null);
  public accessRestriction$ = this.accessRestrictionSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private csrfService: CsrfService
  ) {
    this.loadUserFromStorage();
    
    // Hybrid approach: If user data exists, validate session is still active
    // Delay the call to avoid circular dependency with HttpClient/Interceptors
    if (this.getCurrentUser()) {
      setTimeout(() => this.validateSession(), 0);
    }
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

              const tenantInfoRaw = body.user.tenant ?? null;
              const tenantInfo = this.normalizeTenantInfo(tenantInfoRaw);
              const tenantId =
                typeof tenantInfoRaw === 'string'
                  ? tenantInfoRaw
                  : tenantInfo?._id ?? tenantInfo?.tenantId ?? null;

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

              const normalizedUser = this.normalizeUser(user);
              this.saveUser(normalizedUser);
              this.userSubject.next(normalizedUser);
              this.clearAccessRestrictionState();
              this.log('login:user-normalized', {
                userId: normalizedUser.userId,
                tenantId: normalizedUser.tenantId,
                isGlobalAdmin: normalizedUser.isGlobalAdmin,
                scopesCount: Array.isArray(normalizedUser.scopes) ? normalizedUser.scopes.length : 0,
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
    const normalizedUser = this.normalizeUser(user);

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
    this.clearAccessRestrictionState();
    this.log('state:clear-session');
  }

  updateCurrentUser(updatedUser: AuthenticatedUser): void {
    const normalized = this.normalizeUser(updatedUser);
    this.saveUser(normalized);
    this.userSubject.next(normalized);
    this.log('state:update-user', {
      userId: normalized.userId,
      tenantId: normalized.tenantId,
      scopesCount: normalized.scopes?.length ?? 0,
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
      const normalized = this.normalizeUser(user);
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
    return (
      user?.tenant ??
      user?.tenantId ??
      user?.tenantInfo?._id ??
      user?.tenantInfo?.tenantId ??
      null
    );
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

  getTenantAccessState(now: Date = new Date()): TenantAccessState {
    const user = this.userSubject.getValue();

    if (!user) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        tenantId: null,
        tenantName: null,
      };
    }

    if (user.isGlobalAdmin) {
      return {
        allowed: true,
        tenantId: null,
        tenantName: null,
        details: undefined,
      };
    }

    const tenantInfo = this.normalizeTenantInfo(
      user.tenantInfo ?? (typeof (user as any).tenant === 'object' ? (user as any).tenant : null),
    );

    const tenantId =
      user.tenantId ??
      (typeof user.tenant === 'string' ? user.tenant : null) ??
      tenantInfo?._id ??
      tenantInfo?.tenantId ??
      null;

    const baseDetails = tenantInfo
      ? {
          status: tenantInfo.status,
          hasActiveLicense: tenantInfo.hasActiveLicense,
          licenseStartDate: tenantInfo.licenseStartDate ?? null,
          licenseExpiryDate: tenantInfo.licenseExpiryDate ?? null,
          suspendedAt: tenantInfo.suspendedAt ?? null,
          suspensionReason: tenantInfo.suspensionReason ?? null,
        }
      : undefined;

    if (!tenantId) {
      return {
        allowed: false,
        reason: 'missing-tenant',
        tenantId: null,
        tenantName: tenantInfo?.name ?? null,
        details: baseDetails,
        message: 'Tenant context is missing for the current user.',
      };
    }

    const stateBase: TenantAccessState = {
      allowed: true,
      tenantId,
      tenantName: tenantInfo?.name ?? null,
      details: baseDetails,
    };

    if (tenantInfo?.status === 'suspended') {
      return {
        ...stateBase,
        allowed: false,
        reason: 'suspended',
        message: tenantInfo.suspensionReason ?? 'Tenant is suspended.',
      };
    }

    if (tenantInfo?.status === 'pending') {
      return {
        ...stateBase,
        allowed: false,
        reason: 'pending',
        message: 'Tenant activation is pending.',
      };
    }

    if (tenantInfo?.hasActiveLicense === false) {
      return {
        ...stateBase,
        allowed: false,
        reason: 'license-inactive',
        message: 'Tenant license is inactive.',
      };
    }

    const expiryTimestamp = tenantInfo?.licenseExpiryDate
      ? new Date(tenantInfo.licenseExpiryDate).getTime()
      : null;

    if (
      expiryTimestamp !== null &&
      !Number.isNaN(expiryTimestamp) &&
      expiryTimestamp < now.getTime()
    ) {
      return {
        ...stateBase,
        allowed: false,
        reason: 'license-expired',
        message: 'Tenant license has expired.',
      };
    }

    return stateBase;
  }

  isTenantAccessAllowed(): boolean {
    return this.getTenantAccessState().allowed;
  }

  setAccessRestrictionState(state: TenantAccessState | null): void {
    this.accessRestrictionSubject.next(state);
  }

  clearAccessRestrictionState(): void {
    this.setAccessRestrictionState(null);
  }

  getAccessRestrictionState(): TenantAccessState | null {
    return this.accessRestrictionSubject.getValue();
  }

  private resolveDefaultRoute(
    user: AuthenticatedUser | null,
    storedReturnUrl: string | null,
  ): string {
    const normalizedReturnUrl = this.normalizeReturnUrl(storedReturnUrl);

    if (user?.isGlobalAdmin) {
      if (!normalizedReturnUrl || normalizedReturnUrl === '/login') {
        return '/admin/overview';
      }

      const sanitized = normalizedReturnUrl.split('?')[0];
      const disallowed = new Set(['', '/', '/home', '/unauthorized', '/access-restriction']);

      if (disallowed.has(sanitized)) {
        return '/admin/overview';
      }

      return normalizedReturnUrl.startsWith('/')
        ? normalizedReturnUrl
        : `/${normalizedReturnUrl}`;
    }

    if (normalizedReturnUrl && normalizedReturnUrl !== '/login') {
      return normalizedReturnUrl.startsWith('/')
        ? normalizedReturnUrl
        : `/${normalizedReturnUrl}`;
    }

    return '/home';
  }

  private normalizeReturnUrl(url: string | null): string | null {
    if (!url) {
      return null;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return null;
      }
    }

    return url;
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

  private normalizeUser(user: AuthenticatedUser): AuthenticatedUser {
    const rawTenantInfo =
      user.tenantInfo ?? (typeof (user as any).tenant === 'object' ? (user as any).tenant : null);

    const tenantInfo = this.normalizeTenantInfo(rawTenantInfo);
    const tenantId =
      user.tenantId ??
      (typeof user.tenant === 'string' ? user.tenant : null) ??
      tenantInfo?._id ??
      tenantInfo?.tenantId ??
      null;

    return {
      ...user,
      tenant: tenantId ?? undefined,
      tenantId: tenantId ?? null,
      tenantInfo,
      scopes: Array.isArray(user.scopes) ? user.scopes : [],
      isGlobalAdmin: user.isGlobalAdmin === true,
    };
  }

  private normalizeTenantInfo(raw: unknown): RoleTenantInfo | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const data = raw as Record<string, unknown>;
    const idValue = data['tenantId'] ?? data['_id'] ?? data['id'] ?? null;
    const normalizedId = idValue != null ? String(idValue) : null;

    const statusValue = data['status'];
    const normalizedStatus: 'active' | 'suspended' | 'pending' | undefined =
      statusValue === 'active' || statusValue === 'suspended' || statusValue === 'pending'
        ? (statusValue as 'active' | 'suspended' | 'pending')
        : undefined;

    const hasActiveLicenseValue = data['hasActiveLicense'];
    const hasActiveLicense =
      typeof hasActiveLicenseValue === 'boolean' ? (hasActiveLicenseValue as boolean) : undefined;

    return {
      _id: normalizedId,
      tenantId: normalizedId,
      name: typeof data['name'] === 'string' ? (data['name'] as string) : null,
      isGlobal: data['isGlobal'] === true,
      status: normalizedStatus,
      hasActiveLicense,
      licenseStartDate: this.normalizeDateValue(data['licenseStartDate']),
      licenseExpiryDate: this.normalizeDateValue(data['licenseExpiryDate']),
      suspendedAt: this.normalizeDateValue(data['suspendedAt']),
      suspensionReason:
        typeof data['suspensionReason'] === 'string'
          ? (data['suspensionReason'] as string)
          : null,
    };
  }

  private normalizeDateValue(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }

    const parsed = new Date(value as any);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
}
