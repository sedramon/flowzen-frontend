import { CommonModule } from '@angular/common';
import { Component, Inject, ViewChild, ElementRef, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule, MatDatepickerInputEvent, MatDatepicker } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeesService } from '../../services/employees.service';
import { environment } from '../../../../../environments/environment';
import { Facility } from '../../../../models/Facility';
import { AppointmentsService } from '../../../appoitments/services/appointment.service';

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
  @ViewChild('monthPicker') monthPicker!: MatDatepicker<Date>;

  facilities: Facility[] = [];

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
    facility: new FormControl(''),
    avatarUrl: new FormControl('')
  });

  workingDayControl = new FormControl<Date | null>(null);

  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;
  private apiUrl = environment.apiUrl;

  showMonthPicker = false;
  selectedMonth: Date | null = null;
  today = new Date();

  selectedWorkDays: Date[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditEmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private employeesService: EmployeesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private appointmentsService: AppointmentsService
  ) {
  }

  ngOnInit(): void {
    // Load facilities for the current tenant
    this.appointmentsService.getFacilities().subscribe((facilities: any[]) => {
      this.facilities = facilities;
    });

    const emp = this.data.employee;
    
    // Handle facility object from autopopulate
    let facilityId = emp.facility;
    if (typeof emp.facility === 'object' && emp.facility !== null) {
      facilityId = (emp.facility as any)._id || (emp.facility as any).id;
    }

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
      facility: facilityId || '',
      avatarUrl: emp.avatarUrl || '',
    });
    this.avatarPreview = emp.avatarUrl ? this.apiUrl + emp.avatarUrl : 'user-profile-image.png';
  }

  ngAfterViewInit() {
    // this.scrollToBottom();
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
        // Keep existing avatarUrl if no new file is selected
        const employee = {
          ...this.employeeForm.value
        };
        this.dialogRef.close(employee);
      }
    }
  }


  private scrollToBottom() {
    if (this.dialogContent) {
      // Prvo instant na dno, pa onda smooth još jednom za svaki slučaj
      this.dialogContent.nativeElement.scrollTop = this.dialogContent.nativeElement.scrollHeight;
      setTimeout(() => {
        this.dialogContent.nativeElement.scrollTo({
          top: this.dialogContent.nativeElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 10);
    }
  }



  showSnackbar(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Zatvori', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: isError ? ['snackbar-error'] : ['snackbar-success']
    });
  }

  deleteEmployee() {
    this.employeesService.deleteEmployee(this.data.employee._id).subscribe(() => {
      this.dialogRef.close();
      this.showSnackbar('Employee deleted successfully!', true);
    })
  }
}

// Custom validator
function arrayRequiredValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  };
}
