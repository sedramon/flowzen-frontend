import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeesService } from '../../services/employees.service';
import { Facility } from '../../../../models/Facility';
import { AppointmentsService } from '../../../appointments/services/appointment.service';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-add-employee-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule
  ],
  templateUrl: './add-employee-dialog.component.html',
  styleUrl: './add-employee-dialog.component.scss',
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
export class AddEmployeeDialogComponent implements OnInit {
  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  facilities: Facility[] = [];
  facilityOptions: { label: string; value: string }[] = [];

  employeeForm = new FormGroup({
    firstName: new FormControl<string>('', [Validators.required]),
    lastName: new FormControl<string>('', [Validators.required]),
    contactEmail: new FormControl<string>('', [
      Validators.required,
      Validators.email,
    ]),
    contactPhone: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^\d{10}$/),
    ]),
    dateOfBirth: new FormControl<Date>(new Date(), [Validators.required]),
    jobRole: new FormControl<string>('', [Validators.required]),
    isActive: new FormControl<boolean>(true, [Validators.required]),
    includeInAppoitments: new FormControl<boolean>(true, [Validators.required]),
    tenant: new FormControl<string>('', [Validators.required]),
    facilities: new FormControl<string[]>([]),
    avatarUrl: new FormControl<string>('')
  });

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<AddEmployeeDialogComponent>,
    private employeesService: EmployeesService,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.employeeForm
      .get('tenant')
      ?.setValue(this.authService.requireCurrentTenantId());
    
    // Load facilities for the current tenant
    this.appointmentsService.getFacilities().subscribe((facilities: any[]) => {
      this.facilities = facilities;
      this.facilityOptions = facilities.map(f => ({
        label: f.name,
        value: f._id
      }));
    });
  }

  createEmployee() {
    if (this.employeeForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });

      if (this.selectedAvatarFile) {
        this.employeesService.uploadAvatar(this.selectedAvatarFile).subscribe({
          next: (res) => {
            const employee = {
              ...this.employeeForm.value,
              avatarUrl: res.url,
            };
            this.dialogRef.close(employee);
          },
          error: () => {
            alert('Greška pri uploadu slike!');
          }
        });
      } else {
        // Remove avatarUrl if no file is selected
        const { avatarUrl, ...employeeData } = this.employeeForm.value;
        this.dialogRef.close(employeeData);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  onAvatarClick() {
    (document.getElementById('avatarInput') as HTMLInputElement).click();
  }

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }
}
