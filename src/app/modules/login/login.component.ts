import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../../core/services/auth.service';

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
    private route: ActivatedRoute,
    private messageService: MessageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
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
    console.log('Form submitted');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form value:', this.loginForm.value);
    console.log('Form errors:', this.loginForm.errors);
    console.log('Username errors:', this.loginForm.get('username')?.errors);
    console.log('Password errors:', this.loginForm.get('password')?.errors);

    if (this.loginForm.valid) {
      console.log('✅ Form is valid, calling backend...');
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
        error: (error) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: error.error?.message || 'Invalid credentials'
          });
        }
      });
    } else {
      console.log('❌ Form is invalid, showing validation errors...');
      this.markFormGroupTouched();
      this.showValidationErrors();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private showValidationErrors(): void {
    const errors: string[] = [];
    
    // Check email errors
    const emailField = this.loginForm.get('username');
    if (emailField?.invalid) {
      if (emailField.errors?.['required']) {
        errors.push('Email is required');
      } else if (emailField.errors?.['email']) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // Check password errors
    const passwordField = this.loginForm.get('password');
    if (passwordField?.invalid) {
      if (passwordField.errors?.['required']) {
        errors.push('Password is required');
      } else if (passwordField.errors?.['minlength']) {
        const minLength = passwordField.errors['minlength'].requiredLength;
        errors.push(`Password must be at least ${minLength} characters`);
      }
    }
    
    // Show all validation errors in a single toast
    if (errors.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: errors.join('. '),
        life: 5000
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
