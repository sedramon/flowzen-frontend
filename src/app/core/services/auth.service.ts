import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'access_token';

  constructor(private http: HttpClient) {}

  /**
   * Method to log in a user.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns Observable with the API response.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
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
    return !!this.getToken();
  }

}
