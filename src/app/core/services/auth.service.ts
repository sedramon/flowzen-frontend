import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';

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
}
