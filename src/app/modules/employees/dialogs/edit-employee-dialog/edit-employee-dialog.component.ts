import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-employee-dialog',
  standalone: true,
   providers: [provideNativeDateAdapter()],
    imports: [CommonModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatInputModule, FlexLayoutModule, MatDatepickerModule],
  templateUrl: './edit-employee-dialog.component.html',
  styleUrl: './edit-employee-dialog.component.scss'
})
export class EditEmployeeDialogComponent {
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

    constructor(private dialogRef: MatDialogRef<EditEmployeeDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { 
      this.employeeForm = new FormGroup({
        firstName: new FormControl<string>(data.employee.firstName || '', [Validators.required]),
        lastName: new FormControl<string>(data.employee.lastName || '', [Validators.required]),
        contactEmail: new FormControl<string>(data.employee.contactEmail || '', [Validators.required, Validators.email]),
        contactPhone: new FormControl<string>(data.employee.contactPhone || '', [Validators.required, Validators.pattern(/^\d{10}$/)]),
        dateOfBirth: new FormControl<Date>(data.employee.dateOfBirth || new Date(), [Validators.required]),
        jobRole: new FormControl<string>(data.employee.jobRole || '', [Validators.required]),
        isActive: new FormControl<boolean>(data.employee.isActive ?? true, [Validators.required]),
        includeInAppoitments: new FormControl<boolean>(data.employee.includeInAppoitments || true, [Validators.required]),
        tenant: new FormControl<string>(data.employee.tenant || '', [Validators.required])
      });
    }

    closeDialog() {
      this.dialogRef.close();
    }

    updateEmployee() {
      if (this.employeeForm.valid) {
        const employee = {
          ...this.employeeForm.value
        };
        this.dialogRef.close(employee);
      }
    }
}
