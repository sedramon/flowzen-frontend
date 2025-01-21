import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  credentials = {
    username: '',
    password: '',
  };

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    const { username, password } = this.credentials;
  
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        const token = response.access_token; // Extract token from the response
        this.authService.saveToken(token); // Save the token to localStorage
        alert('Login successful');
        this.router.navigate(['/home']); // Redirect to the dashboard
      },
      error: (err) => {
        console.error('Login failed:', err);
        alert('Invalid credentials');
      },
    });
  }

}
