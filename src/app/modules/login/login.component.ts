import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  credentials = {
    username: '',
    password: '',
  };

  loginError = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    const { username, password } = this.credentials;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        const token = response.access_token; // Extract token from the response
        this.authService.saveToken(token); // Save the token to localStorage
        this.loginError = false; // Reset the error flag
        this.router.navigate(['/home']); // Redirect to the dashboard
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.loginError = true; // Set error flag to show general error message
      },
    });
  }

}
