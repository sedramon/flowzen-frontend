import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';

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

  constructor(private authService: AuthService) {}

  onSubmit() {
    const { username, password } = this.credentials;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        // Ovde možete sačuvati token ili preusmeriti korisnika
      },
      error: (err) => {
        console.error('Login failed:', err);
        alert('Invalid credentials');
      },
    });
  }

}
