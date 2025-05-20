import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeesService } from '../../services/employees.service';
import { environmentDev } from '../../../../../environments/environment';

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
  styleUrl: './edit-employee-dialog.component.scss'
})
export class EditEmployeeDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLDivElement>;

  employeeForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    contactEmail: new FormControl('', [Validators.required, Validators.email]),
    contactPhone: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    dateOfBirth: new FormControl(new Date(), Validators.required),
    jobRole: new FormControl('', Validators.required),
    isActive: new FormControl(true, Validators.required),
    includeInAppoitments: new FormControl(true, Validators.required),
    tenant: new FormControl('', Validators.required),
    workingDays: new FormControl<string[]>([], arrayRequiredValidator()),
    avatarUrl: new FormControl('')
  });

  workingDayControl = new FormControl<Date | null>(null);

  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  private apiUrl = environmentDev.apiUrl;

  constructor(
    private dialogRef: MatDialogRef<EditEmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private employeesService: EmployeesService
  ) {
  }

  ngOnInit(): void {
    const emp = this.data.employee;
    this.employeeForm.patchValue({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      contactEmail: emp.contactEmail || '',
      contactPhone: emp.contactPhone || '',
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : new Date(),
      jobRole: emp.jobRole || '',
      isActive: emp.isActive ?? true,
      includeInAppoitments: emp.includeInAppoitments ?? true,
      tenant: emp.tenant || '',
      workingDays: emp.workingDays || [],
      avatarUrl: emp.avatarUrl || '',
    });
    this.avatarPreview = emp.avatarUrl ? this.apiUrl + emp.avatarUrl : 'user-profile-image.png';
  }

  ngAfterViewInit() {
    this.scrollToBottom();
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

  addWorkingDay(date: Date | null) {
    if (!date) return;
    const iso = date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
    const current = this.employeeForm.controls['workingDays'].value || [];
    if (!current.includes(iso)) {
      this.employeeForm.controls['workingDays'].setValue([...current, iso]);
    }
    this.workingDayControl.setValue(null);
    setTimeout(() => this.scrollToBottom(), 0);
  }

  removeWorkingDay(index: number) {
    const current = this.employeeForm.controls['workingDays'].value || [];
    current.splice(index, 1);
    this.employeeForm.controls['workingDays'].setValue([...current]);
  }

  dateClass = (d: Date) => {
    const date =
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0');
    const selected = this.employeeForm.controls['workingDays'].value || [];
    return selected.includes(date) ? 'selected-working-day' : '';
  };

  private scrollToBottom() {
    if (this.dialogContent) {
      this.dialogContent.nativeElement.scrollTo({
        top: this.dialogContent.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
}

// Custom validator
function arrayRequiredValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  };
}
