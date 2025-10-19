import { Injectable } from '@angular/core';

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

  /**
   * Store the CSRF token received from the backend
   */
  setToken(token: string): void {
    console.log('💾 CsrfService: Storing token:', token?.substring(0, 20) + '...');
    this.csrfToken = token;
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string | null {
    console.log('🔑 CsrfService: Getting token:', this.csrfToken ? this.csrfToken.substring(0, 20) + '...' : 'null');
    return this.csrfToken;
  }

  /**
   * Clear the CSRF token (on logout)
   */
  clearToken(): void {
    this.csrfToken = null;
  }

  /**
   * Check if we have a CSRF token
   */
  hasToken(): boolean {
    return this.csrfToken !== null && this.csrfToken !== '';
  }
}

