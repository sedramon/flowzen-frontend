import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
import { Employee } from '../../../../models/Employee';
import { environment } from '../../../../../environments/environment';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-edit-employee-dialog',
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
  templateUrl: './edit-employee-dialog.component.html',
  styleUrl: './edit-employee-dialog.component.scss',
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
export class EditEmployeeDialogComponent implements OnInit {
  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  facilities: Facility[] = [];
  facilityOptions: { label: string; value: string }[] = [];
  employee: Employee;

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
    private dialogRef: MatDialogRef<EditEmployeeDialogComponent>,
    private employeesService: EmployeesService,
    private appointmentsService: AppointmentsService,
    @Inject(MAT_DIALOG_DATA) public data: { employee: Employee }
  ) {
    this.employee = data.employee;
  }

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

    // Populate form with employee data
    this.populateForm();
  }

  populateForm() {
    if (this.employee) {
      // Handle tenant - extract ID if it's an object
      let tenantId: string = '';
      if (typeof this.employee.tenant === 'string') {
        tenantId = this.employee.tenant;
      } else if (typeof this.employee.tenant === 'object' && this.employee.tenant !== null) {
        tenantId = (this.employee.tenant as any)._id || (this.employee.tenant as any).id || '';
      }

      this.employeeForm.patchValue({
        firstName: this.employee.firstName,
        lastName: this.employee.lastName,
        contactEmail: this.employee.contactEmail,
        contactPhone: this.employee.contactPhone,
        dateOfBirth: new Date(this.employee.dateOfBirth),
        jobRole: this.employee.jobRole,
        isActive: this.employee.isActive,
        includeInAppoitments: this.employee.includeInAppoitments,
        tenant: tenantId,
        facilities: this.employee.facilities?.map(f => typeof f === 'string' ? f : f._id) || [],
        avatarUrl: this.employee.avatarUrl
      });

      if (this.employee.avatarUrl) {
        this.avatarPreview = `${environment.apiUrl}${this.employee.avatarUrl}`;
      }
    }
  }

  updateEmployee() {
    if (this.employeeForm.valid) {
      let avatarUrl = this.employeeForm.value.avatarUrl;
      if (this.selectedAvatarFile) {
        this.employeesService.uploadAvatar(this.selectedAvatarFile).subscribe({
          next: (res) => {
            avatarUrl = res.url;
            const employee = {
              ...this.employeeForm.value,
              avatarUrl,
            };
            this.dialogRef.close(employee);
          },
          error: () => {
            alert('Greška pri uploadu slike!');
          }
        });
      } else {
        const employee = {
          ...this.employeeForm.value
        };
        this.dialogRef.close(employee);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.employeeForm.controls).forEach(key => {
        this.employeeForm.get(key)?.markAsTouched();
      });
    }
  }

  deleteEmployee() {
    if (confirm('Da li ste sigurni da želite da obrišete ovog zaposlenog?')) {
      this.dialogRef.close({ action: 'delete', employeeId: this.employee._id });
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
      reader.onload = e => this.avatarPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }
}
