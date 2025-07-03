import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environmentDev } from '../../../environments/environment';
import { Employee } from '../../models/Employee';
import { WorkingShiftsService } from './services/working-shifts.service';
import { EditWorkingDayDialogComponent } from './dialogs/edit-working-day-dialog/edit-working-day-dialog.component';

interface CalendarDay {
  date: Date;
  shift?: { shiftType: string; note?: string };
  _id?: string;
}

@Component({
  selector: 'app-working-shifts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './working-shifts.component.html',
  styleUrls: ['./working-shifts.component.scss']
})
export class WorkingShiftsComponent implements OnInit {
  form: FormGroup;
  employees: Employee[] = [];
  weeks: CalendarDay[][] = [];
  loading = false;

  shiftTypes = [
    { value: 'morning', label: 'Jutarnja', color: '#8c0055', startHour: 8, endHour: 14 },
    { value: 'afternoon', label: 'Popodnevna', color: '#b3006e', startHour: 14, endHour: 20 },
    { value: 'evening', label: 'Večernja', color: '#8c0055', startHour: 16, endHour: 22 },
    { value: 'full', label: 'Cela smena', color: '#b3006e', startHour: 8, endHour: 20 }
  ];

  startAt = new Date();

  constructor(
    private fb: FormBuilder,
    private wsService: WorkingShiftsService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale('sr-RS');
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      month: [null, Validators.required] // sada je Date objekat
    });
  }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    const tenantId = '67bcf25a3311448ed3af993f';
    this.http.get<Employee[]>(`${environmentDev.apiUrl}/employees?tenant=${tenantId}`)
      .subscribe(res => {
        this.employees = res.filter(e => e.includeInAppoitments);
      });
  }

  loadSchedule() {
    if (this.form.invalid) return;
    const monthVal: Date = this.form.value.month;
    this.buildCalendar(monthVal);
  }

  buildCalendar(monthDate: Date) {
    if (!monthDate) return;
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth(); // 0-based
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    const firstWeekDay = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < firstWeekDay; i++) {
      currentWeek.push(null!);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      currentWeek.push({ date });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null!);
      }
      weeks.push(currentWeek);
    }

    this.weeks = weeks;
  }

  openEditDialogForDay(day: CalendarDay) {
    const data = {
      date: day.date,
      employeeId: this.form.value.employeeId,
      shift: day.shift || { shiftType: null, note: '' },
      shiftTypes: this.shiftTypes
    };

    const dialogRef = this.dialog.open(EditWorkingDayDialogComponent, {
      width: '400px',
      data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        day.shift = result.shiftType ? { shiftType: result.shiftType, note: result.note } : undefined;
        this.snackBar.open('Radni dan izmenjen!', 'Zatvori', { duration: 2000 });
      }
    });
  }

  getWeekdayName(dayIndex: number): string {
    const names = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
    return names[dayIndex];
  }

  getShiftType(value: string): { label: string; color: string; startHour?: number; endHour?: number } {
    const result = this.shiftTypes.find(t => t.value === value);
    return result || { label: 'Nepoznato', color: '#000000' };
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    this.form.get('month')?.setValue(normalizedMonth);
    datepicker.close();
  }
}
