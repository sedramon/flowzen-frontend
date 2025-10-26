import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FlexLayoutModule, 
    ButtonModule, 
    InputTextModule, 
    PasswordModule, 
    CardModule, 
    MessageModule,
    ToastModule,
    RouterModule
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      password: ['', [Validators.required]]
    });

    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    this.returnUrl = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
  }

  ngOnInit() {
    const fromClient = this.route.snapshot.queryParams['fromClient'];
    if (fromClient) {
      setTimeout(() => {
        const container = document.querySelector('.main-container');
        if (container) {
          container.classList.add('fade-in-from-client');
        }
      }, 100);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Login successful!'
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Login failed:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: err.error?.message || 'Invalid username or password'
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Password must be at least ${requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'username') {
          return 'Please enter a valid email address';
        }
        if (fieldName === 'password') {
          return 'Password must contain at least 1 number and 1 special character (@$!%*?&)';
        }
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
