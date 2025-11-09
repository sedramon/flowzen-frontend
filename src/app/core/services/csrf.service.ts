import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * CSRF Service for managing CSRF tokens
 * 
 * The token is stored in memory (not localStorage) for security.
 * The backend sends the token via X-CSRF-Token header.
 * We send it back in the same header for state-changing requests.
 */
@Injectable({
  providedIn: 'root'
})
export class CsrfService {
  private csrfToken: string | null = null;
  private readonly debugAuth = environment.debugAuth === true;

  /**
   * Store the CSRF token received from the backend
   */
  setToken(token: string): void {
    if (this.debugAuth) {
      console.info('[CsrfService] setToken', {
        tokenPrefix: token?.substring(0, 12),
      });
    }
    this.csrfToken = token;
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string | null {
    if (this.debugAuth) {
      console.info('[CsrfService] getToken', {
        tokenAvailable: !!this.csrfToken,
      });
    }
    return this.csrfToken;
  }

  /**
   * Clear the CSRF token (on logout)
   */
  clearToken(): void {
    this.csrfToken = null;
    if (this.debugAuth) {
      console.info('[CsrfService] clearToken');
    }
  }

  /**
   * Check if we have a CSRF token
   */
  hasToken(): boolean {
    return this.csrfToken !== null && this.csrfToken !== '';
  }
}

