import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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

@Component({
  selector: 'app-add-employee-dialog',
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
  templateUrl: './add-employee-dialog.component.html',
  styleUrl: './add-employee-dialog.component.scss',
})
export class AddEmployeeDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLDivElement>;

  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  facilities: Facility[] = [];

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

  workingDayControl = new FormControl<Date | null>(null);

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<AddEmployeeDialogComponent>,
    private employeesService: EmployeesService,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    this.employeeForm
      .get('tenant')
      ?.setValue(this.authService.getCurrentUser()!.tenant!);
    
    // Load facilities for the current tenant
    this.appointmentsService.getFacilities().subscribe((facilities: any[]) => {
      this.facilities = facilities;
    });
  }

  ngAfterViewInit() {
    // this.scrollToBottom();
  }

  createEmployee() {
    if (this.employeeForm.valid) {
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
