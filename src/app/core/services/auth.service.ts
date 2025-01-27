import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Method to log in a user.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns Observable with the API response.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        this.clearToken();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.clearToken();
        this.router.navigate(['/login']);
      },
    });
  }

   /**
   * Save JWT token to localStorage.
   * @param token - JWT token.
   */
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT token from localStorage.
   * @returns Token string or null.
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Clear token from localStorage (for logout).
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Check if the user is logged in.
   * @returns True if a token exists, false otherwise.
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
  
    try {
      const decodedToken: { exp: number } = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      return decodedToken.exp > now; // Check if the token is still valid
    } catch (error) {
      console.error('Invalid token:', error);
      this.clearToken(); // Clear invalid token
      return false;
    }
  }

  /**
   * Get user info from the JWT token.
   * @returns Decoded user information or null.
   */
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) return null;
  
    try {
      const decodedToken: any = jwtDecode(token); // Decode the token
      return decodedToken; // Return the payload
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  /**
   * Get scopes from the JWT token.
   * @returns An array of scopes or an empty array if none exist.
   */
  /**
   * Get scopes from the JWT token.
   * @returns An array of scope names or an empty array if none exist.
   */
  getScopes(): string[] {
    const userInfo = this.getUserInfo();
    const availableScopes = userInfo?.role?.availableScopes || [];
    console.log(availableScopes);
    return availableScopes.map((scope: any) => scope.name); // Extract and return scope names
  }

}
