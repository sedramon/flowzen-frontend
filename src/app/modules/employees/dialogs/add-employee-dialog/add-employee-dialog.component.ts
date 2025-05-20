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
    workingDays: new FormControl<string[]>([], [Validators.required]),
  });

  workingDayControl = new FormControl<Date | null>(null);

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<AddEmployeeDialogComponent>
  ) {}

  ngOnInit(): void {
    this.employeeForm
      .get('tenant')
      ?.setValue(this.authService.getCurrentUser()!.tenant);
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  createEmployee() {
    const employee = this.employeeForm.value;
    this.dialogRef.close(employee);
  }

  closeDialog() {
    this.dialogRef.close();
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
    // Formate like 'YYYY-MM-DD'
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
