import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Role } from '../../../../models/Role';
import { UserAdministrationService } from '../../services/user-administration.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../models/User';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule],
  templateUrl: './add-user-dialog.component.html',
  styleUrl: './add-user-dialog.component.scss'
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

  constructor(private userAdministrationService: UserAdministrationService, private dialogRef: MatDialogRef<AddUserDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private authService: AuthService) { }

  ngOnInit(): void {
    this.allRoles = this.userAdministrationService.getCurrentRoles();

    this.userForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant!);

    console.log(this.userForm.value);
  }

  createUser() {
    const user: User = {
      name: this.userForm.get('name')?.value || '',
      email: this.userForm.get('email')?.value || '',
      password: this.userForm.get('password')?.value || '',
      role: this.userForm.get('role')?.value || '',
      tenant: this.userForm.get('tenant')?.value || ''
    };

    this.dialogRef.close(user);
    }
  

  closeDialog() {
    this.dialogRef.close();
  }

}
