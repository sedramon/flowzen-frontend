import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Role } from '../../../../models/Role';
import { HttpClient } from '@angular/common/http';
import { UserAdministrationService } from '../../services/user-administration.service';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss'
})
export class EditUserDialogComponent {
  userForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    role: new FormControl<string>('', [Validators.required])
  });

  allRoles: Role[] = [];


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
   }



  updateUser(){
    const updatedData = {
      name: this.userForm.get('name')?.value || '',
      role: this.userForm.get('role')?.value || '',
      tenant: this.data.user.tenant._id
    };

    this.dialogRef.close(updatedData);
    }
  

  closeDialog() {
    this.dialogRef.close();
  }
}
