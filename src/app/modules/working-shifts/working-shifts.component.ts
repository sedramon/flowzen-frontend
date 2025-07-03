import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormGroupDirective } from '@angular/forms';
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
import { Employee } from '../../models/Employee';
import { WorkingShiftsService } from './services/working-shifts.service';
import { EditWorkingDayDialogComponent } from './dialogs/edit-working-day-dialog/edit-working-day-dialog.component';
import { FormControl } from '@angular/forms';
import { ShiftsService } from './services/shifts.service'; // importuj servis
import { MatListModule } from '@angular/material/list';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface CalendarDay {
  date: Date;
  shift?: {
    shiftType: string;
    note?: string;
    startHour?: number;
    endHour?: number;
  };
  _id?: string;
  animate?: boolean;
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
    MatSnackBarModule,
    FormsModule,
    MatListModule
  ],
  templateUrl: './working-shifts.component.html',
  styleUrls: ['./working-shifts.component.scss']
})
export class WorkingShiftsComponent implements OnInit {
  
  @ViewChild('shiftFormDir') private shiftFormDir!: FormGroupDirective;

  form: FormGroup;
  employees: Employee[] = [];
  weeks: CalendarDay[][] = [];
  loading = false;
  editShiftsMode = false; // Dodaj ovu promenljivu

  shiftTypes: any[] = []; // više nema zakucanih vrednosti, backend puni ovo
  activeShiftType: string = '';

  shiftEnumOptions = [
    { value: 'morning', label: 'Jutarnja' },
    { value: 'afternoon', label: 'Popodnevna' },
    { value: 'evening', label: 'Večernja' },
    { value: 'full', label: 'Cela smena' },
    { value: 'custom', label: 'Custom' }
  ];

  timeOptions: number[] = [];

  startAt = new Date();
  shiftForm: FormGroup;
  editingShift: any = null;

  currentUser: any; // Dodaj property

  constructor(
    private fb: FormBuilder,
    private wsService: WorkingShiftsService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>,
    private shiftsService: ShiftsService,
    private authService: AuthService // Dodaj u konstruktor
  ) {
    // this.dateAdapter.setLocale('sr-RS');
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      month: [null, Validators.required] // sada je Date objekat
    });
    this.timeOptions = [];
    for (let h = 0; h <= 23.5; h += 0.5) {
      this.timeOptions.push(h);
    }
    this.timeOptions.push(24); // Dodaj i 24:00 kao opciju
    this.shiftForm = this.fb.group({
      value: ['', Validators.required],
      label: ['', Validators.required],
      color: ['#ffe082', Validators.required],
      startHour: [null, Validators.required],
      endHour: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser(); // Učitaj jednom
    this.loadEmployees();
    this.loadShifts();
  }

  loadEmployees() {
    const tenantId = this.currentUser?.tenant;
    this.http.get<Employee[]>(`${environment.apiUrl}/employees?tenant=${tenantId}`)
      .subscribe(res => {
        this.employees = res.filter(e => e.includeInAppoitments);
      });
  }

  loadShifts() {
    const tenantId = this.currentUser?.tenant;
    this.shiftsService.getAllShifts(tenantId).subscribe(shifts => {
      this.shiftTypes = shifts || [];
      // Postavi podrazumevanu smenu samo ako postoji bar jedna smena
      if (this.shiftTypes.length > 0) {
        // Ako prethodno selektovana više ne postoji, uzmi prvu
        if (!this.shiftTypes.find(s => s.value === this.activeShiftType)) {
          this.activeShiftType = this.shiftTypes[0].value;
        }
      } else {
        this.activeShiftType = '';
      }
    });
  }

  loadSchedule() {
    if (this.form.invalid) return;
    const monthVal: Date = this.form.value.month;
    const employeeId = this.form.value.employeeId;
    const tenantId = this.currentUser?.tenant;
    this.weeks = [];
    this.buildCalendar(monthVal);

    // Učitaj smene iz baze
    this.wsService.getShiftsForEmployeeMonth(employeeId, monthVal.getMonth(), monthVal.getFullYear(), tenantId)
      .subscribe(shifts => {
        for (const week of this.weeks) {
          for (const day of week) {
            if (!day) continue;
            const found = shifts.find(s => (new Date(s.date)).toDateString() === day.date.toDateString());
            if (found) {
              day.shift = {
                shiftType: found.shiftType,
                note: found.note,
                startHour: found.startHour,
                endHour: found.endHour
              };
              day._id = found._id;
            } else {
              day.shift = undefined;
              day._id = undefined;
            }
          }
        }
      });
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

  onDayClick(day: CalendarDay) {
    if (!day) return;
    const employeeId = this.form.value.employeeId;
    const tenantId = this.currentUser?.tenant;
    const dateStr = toLocalDateString(day.date);

    day.animate = true;
    setTimeout(() => day.animate = false, 500);

    // Ako već ima istu smenu, briši
    if (day.shift && day.shift.shiftType === this.activeShiftType) {
      day.shift = undefined;
      this.wsService.deleteShiftByEmployeeDate(employeeId, dateStr, tenantId).subscribe();
      return;
    }

    // Pronađi izabranu smenu iz shiftTypes
    const selectedShift = this.shiftTypes.find(s => s.value === this.activeShiftType);

    // Upsert sa kopiranim satnicama iz shiftTypes
    day.shift = { shiftType: this.activeShiftType };
    this.wsService.upsertShift({
      employeeId,
      date: dateStr,
      shiftType: this.activeShiftType,
      startHour: selectedShift?.startHour ?? null,
      endHour: selectedShift?.endHour ?? null,
      tenantId
    }).subscribe();
  }

  getWeekdayName(dayIndex: number): string {
    const names = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
    return names[dayIndex];
  }

  getShiftType(value: string | undefined) {
    return this.shiftTypes.find(t => t.value === value) || { label: '', color: '' };
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    this.form.get('month')?.setValue(normalizedMonth);
    this.weeks = []; // Resetuj kalendar odmah po izboru meseca
    this.form.get('month')?.updateValueAndValidity(); // Forsiraj promenu
    datepicker.close();
  }

  toggleEditShifts() {
    this.editShiftsMode = !this.editShiftsMode;
  }

  saveShift() {
    if (this.shiftForm.invalid) { return; }

    const tenantId = this.currentUser?.tenant;
    const shift = { ...this.shiftForm.value, tenantId };

    const req$ = this.editingShift
        ? this.shiftsService.updateShift(this.editingShift._id, shift)
        : this.shiftsService.createShift(shift);

    req$.subscribe(() => {
        this.loadShifts();       // osveži listu
        this.resetShiftForm();   // očisti polja + submitted state
    });
  }

  resetShiftForm() {
    this.shiftFormDir.resetForm({
      value: '',
      label: '',
      color: '#ffe082',
      startHour: null,
      endHour: null
    });
    this.editingShift = null;
  }

  cancelEditShift() {
    this.editingShift = null;
    this.shiftFormDir.resetForm({
      color: '#ffe082'
    });
  }

  editShift(shift: any) {
    this.editingShift = shift;
    this.shiftForm.patchValue(shift);
  }

  deleteShift(shift: any) {
    this.shiftsService.deleteShift(shift._id).subscribe(() => this.loadShifts());
  }

  formatTime(t: number): string {
    if (t === 24) return '24:00';
    return t % 1 === 0 ? `${t}:00` : `${Math.floor(t)}:30`;
  }
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const dayNum = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${dayNum}`;
}
