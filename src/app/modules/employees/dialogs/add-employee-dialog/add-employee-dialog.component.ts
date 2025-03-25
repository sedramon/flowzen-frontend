import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-add-employee-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule, MatDatepickerModule],
  templateUrl: './add-employee-dialog.component.html',
  styleUrl: './add-employee-dialog.component.scss'
})
export class AddEmployeeDialogComponent implements OnInit {
  employeeForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    contactEmail: new FormControl<string>('', [Validators.required, Validators.email]),
    contactPhone: new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    dateOfBirth: new FormControl<Date>(new Date(), [Validators.required]),
    jobRole: new FormControl<string>('', [Validators.required]),
    isActive: new FormControl<boolean>(true, [Validators.required]),
    includeInAppoitments: new FormControl<boolean>(true, [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required])
  });

  constructor(private authService: AuthService, private dialogRef: MatDialogRef<AddEmployeeDialogComponent>) { }

  ngOnInit(): void {
    this.employeeForm.get('tenant')?.setValue(this.authService.getCurrentUser()!.tenant);
  }

  createEmployee(){
    const employee = {
      firstName: this.employeeForm.get('firstName')?.value,
      lastName: this.employeeForm.get('lastName')?.value,
      contactEmail: this.employeeForm.get('contactEmail')?.value,
      contactPhone: this.employeeForm.get('contactPhone')?.value,
      dateOfBirth: this.employeeForm.get('dateOfBirth')?.value,
      jobRole: this.employeeForm.get('jobRole')?.value,
      isActive: this.employeeForm.get('isActive')?.value,
      includeInAppoitments: this.employeeForm.get('includeInAppoitments')?.value,
      tenant: this.employeeForm.get('tenant')?.value
    };
    
    this.dialogRef.close(employee);
  }

  closeDialog(){
    this.dialogRef.close();
  }
}
