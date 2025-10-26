import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-client-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './client-login.component.html',
  styleUrl: './client-login.component.scss'
})
export class ClientLoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  isNavigating = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Neispravni podaci za prijavu';
          console.error('Login error:', error);
        }
      });
    }
  }

  navigateToAdminLogin() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    
    const container = document.querySelector('.login-container');
    if (container) {
      container.classList.add('fade-out');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { fromClient: 'true' } });
      }, 500);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
