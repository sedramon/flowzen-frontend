import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Role } from '../../../../models/Role';
import { HttpClient } from '@angular/common/http';
import { UserAdministrationService } from '../../services/user-administration.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss',
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
export class EditUserDialogComponent {
  userForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    role: new FormControl<string>('', [Validators.required])
  });

  allRoles: Role[] = [];
  roleOptions: { label: string; value: string }[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    private http: HttpClient,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userAdministrationService: UserAdministrationService
  ) {
    this.userForm = new FormGroup({
      name: new FormControl<string>(data.user.name || ''),
      role: new FormControl<string>(data.user.role.name || '')
    });

    this.allRoles = this.userAdministrationService.getCurrentRoles();
    this.roleOptions = this.allRoles.map(role => ({
      label: role.name,
      value: role.name
    }));
  }

  updateUser() {
    if (this.userForm.valid) {
      const updatedData = {
        name: this.userForm.get('name')?.value || '',
        role: this.userForm.get('role')?.value || '',
        tenant: this.data.user.tenant._id
      };

      this.dialogRef.close(updatedData);
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
