import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { Role } from '../../../../models/Role';
import { UserAdministrationService } from '../../services/user-administration.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../models/User';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    SelectModule,
    PasswordModule
  ],
  templateUrl: './add-user-dialog.component.html',
  styleUrl: './add-user-dialog.component.scss',
  animations: [
    trigger('dialogPop', [
      transition(':enter', [
        animate('250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
          style({ transform: 'scale(0.95)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class AddUserDialogComponent implements OnInit {

  userForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]),
    role: new FormControl<string>('', [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required])
  });

  allRoles: Role[] = [];
  roleOptions: { label: string; value: string }[] = [];

  constructor(
    private userAdministrationService: UserAdministrationService, 
    private dialogRef: MatDialogRef<AddUserDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any, 
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.allRoles = this.userAdministrationService.getCurrentRoles();
    this.roleOptions = this.allRoles.map(role => ({
      label: role.name,
      value: role.name
    }));

    this.userForm.get('tenant')?.setValue(this.authService.requireCurrentTenantId());
  }

  createUser() {
    if (this.userForm.valid) {
      const user: User = {
        name: this.userForm.get('name')?.value || '',
        email: this.userForm.get('email')?.value || '',
        password: this.userForm.get('password')?.value || '',
        role: this.userForm.get('role')?.value || '',
        tenant: this.userForm.get('tenant')?.value || ''
      };

      this.dialogRef.close(user);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
