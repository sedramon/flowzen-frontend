import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeesService } from '../../services/employees.service';
import { Facility } from '../../../../models/Facility';
import { AppointmentsService } from '../../../appoitments/services/appointment.service';
import { Employee } from '../../../../models/Employee';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-edit-employee-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    FlexLayoutModule,
    MatDatepickerModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './edit-employee-dialog.component.html',
  styleUrl: './edit-employee-dialog.component.scss',
})
export class EditEmployeeDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLDivElement>;

  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  facilities: Facility[] = [];
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
      ?.setValue(this.authService.getCurrentUser()!.tenant!);
    
    // Load facilities for the current tenant
    this.appointmentsService.getFacilities().subscribe((facilities: any[]) => {
      this.facilities = facilities;
    });

    // Populate form with employee data
    this.populateForm();
  }

  ngAfterViewInit() {
    // this.scrollToBottom();
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
    }
  }

  deleteEmployee() {
    if (confirm('Are you sure you want to delete this employee?')) {
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

  removeFacility(facilityId: string) {
    const currentFacilities = this.employeeForm.controls['facilities'].value || [];
    const updatedFacilities = currentFacilities.filter(id => id !== facilityId);
    this.employeeForm.controls['facilities'].setValue(updatedFacilities);
  }

  getFacilityName(facilityId: string): string {
    const facility = this.facilities.find(f => f._id === facilityId);
    return facility ? facility.name : 'Unknown Facility';
  }

  private scrollToBottom() {
    if (this.dialogContent) {
      this.dialogContent.nativeElement.scrollTo({
        top: this.dialogContent.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
}
